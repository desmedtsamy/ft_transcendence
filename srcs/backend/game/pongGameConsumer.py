from channels.generic.websocket import WebsocketConsumer
from threading import Lock
import json
import time
import threading
from game.services import getMatch

all_game = []
lock = Lock()  # thread-safe operations

# options a faire d'ou les variables
velocity = 3
canvas_width = 800
canvas_height = 600
paddle_height = 100
paddle_width = 10
ball_size = 10

# game
class Game():
	def __init__(self, id, match):
		self.id = id
		self.player_list = []
		self.match = match
		self.p1_id = match.player1.id
		self.p2_id = match.player2.id
		self.state = {
			'players': {
				1: {'x': 50, 'y': 250},  # left player
				2: {'x': 750, 'y': 250}  # right player
			},
			'ball': {'x': 400, 'y': 300, 'vx': velocity, 'vy': velocity},
			'scores': {1: 0, 2: 0}
		}


class Consumer(WebsocketConsumer):

	def getGame(self):
		match = getMatch(self.scope['url_route']['kwargs']['game_id'])
		id = match.id
		print(f"l'id dr la game{id} ")
		for game in all_game:
			if game.id == id:
				print(f"le score de la game {game.id} quand elle existe deja {game.state}")
				return game
		game = Game(id, match)
		all_game.append(game)
		print(f"le score de la game {game.id} quand je la creer {game.state}")
		return game

	def connect(self):
		self.accept()
		self.id  = int (self.scope['url_route']['kwargs']['user_id'])
		#ajouter la game
		self.game = self.getGame()
		with lock:
			# verifie si le joueur a deja une connection existante
			player_to_remove = None
			for player in self.game.player_list:
				if player.id == self.id:
					print("player already connected. Disconnecting the old connection.")
					player_to_remove = player
					break
			if player_to_remove:
				print("Removing player from the list")
				self.game.player_list.remove(player_to_remove)
			
			# verifie si le client est un membre du match et l'ajoute
			print("Adding player to the list")
			self.game.player_list.append(self)
			if self.id == self.game.p1_id:
				self.role = "left"
			elif self.id == self.game.p2_id:
				self.role = "right"
			else:
				self.refuse_connection()
				return

			self.send_role_to_client()

		if len(self.game.player_list) == 2:
			self.countdown()
			print("Starting the game loop " , self.id)
			self.start_game_loop()
		else:
			print("Waiting for another player to connect ", self.id )

	def refuse_connection(self, reason="Too many players for the game"):
		self.send(json.dumps({"error": reason}))
		self.close()

	def countdown(self):
		self.send_state()
		with lock:
			i = 3
			while i >= 0:
				for client in self.game.player_list:
					#print("valeur de i:", i)
					client.send(json.dumps({"countdown" : i}))
				if i > 0:
					time.sleep(1)
				i -= 1


	def send_role_to_client(self):
		""" Send the player's role (left or right) to the client """
		self.send(json.dumps({
			'type': 'role',
			'role': self.role
		}))
	
	def receive(self, text_data=None, bytes_data=None):
		try:
			if text_data:
				data = json.loads(text_data)
				# print(f"Received data: {data}")
				self.handle_data(data)
			elif bytes_data:
				print(f"Received bytes data: {bytes_data}")
			else:
				print("No valid data received")
		except json.JSONDecodeError as e:
			print(f"JSON decoding error: {e}")
			self.send(json.dumps({"error": "Invalid JSON format"}))
		except Exception as e:
			print(f"Error in receive: {e}")
			self.send(json.dumps({"error": "Server error"}))

	def handle_data(self, data):
		if data.get('type') == 'move':
			self.move_player(data)
		else:
			print("error: wrong data type")
	
	def move_player(self, data):
		position = data.get('position')
		if position is not None:
			if  0 <= position['y'] <= canvas_height - paddle_height:
				if self.role == "left":
					self.game.state['players'][1]['y'] = position['y']
					print("updating player 1")
				elif self.role == "right":
					self.game.state['players'][2]['y'] = position['y']
					print("updating player 2")
		else:
			print("Position data missing")


	def disconnect(self, code):
		with lock:
			if self in self.game.player_list:
				self.game.player_list.remove(self)
				self.role = None
			if len(self.game.player_list) == 0:
				print(f"No players left in game {self.game.id}. Removing from all_game.")
				if self.game in all_game:
					all_game.remove(self.game)
			elif len(self.game.player_list) < 2:
				print(f"Game {self.game.id} paused: only {len(self.game.player_list)} player(s) remain.")
			# self.send_active_player()
			

	def update_game(self):
		ball = self.game.state['ball']
		# with lock:
		# 	state['active_player'] = len(connected_client_list)
		# 	if state['active_player'] < 2:
		# 		return
		left_player = self.game.state['players'][1]
		right_player = self.game.state['players'][2]

		# handle ball logic
		ball['x'] += ball['vx']
		ball['y'] += ball['vy']

		# Collision with top and bottom walls
		if ball['y'] - ball_size <= 0 or ball['y'] + ball_size >= canvas_height:
			ball['vy'] = -ball['vy']

		# Collision with left player's paddle
		if self.check_collision(ball, left_player):
			ball['vx'] = -ball['vx']
			ball['x'] = left_player['x'] + paddle_width + ball_size

		# Collision with right player's paddle
		if self.check_collision(ball, right_player):
			ball['vx'] = -ball['vx']
			ball['x'] = right_player['x'] - paddle_width


		# Reset ball if it goes beyond the left or right bounds
		if ball['x'] <= 0 or ball['x'] >= canvas_width:
			if ball['x'] <= 0:
				self.game.state['scores'][2] += 1  # Right player scores
			else:
				self.game.state['scores'][1] += 1  # Left player scores
			ball['x'], ball['y'], ball['vx'], ball['vy'] = canvas_width/2, canvas_height/2, velocity, velocity

	def check_collision(self, ball, paddle):
		""" Checks if the ball collides with a given paddle """
		ball_rect = {'x': ball['x'], 'y': ball['y'], 'width': ball_size, 'height': ball_size}
		paddle_rect = {'x': paddle['x'], 'y': paddle['y'], 'width': paddle_width, 'height': paddle_height}

		return (ball_rect['x'] <= paddle_rect['x'] + paddle_rect['width'] and
				ball_rect['x'] + ball_rect['width'] >= paddle_rect['x'] and
				ball_rect['y'] <= paddle_rect['y'] + paddle_rect['height'] and
				ball_rect['y'] + ball_rect['height'] >= paddle_rect['y'])

	def	send_state(self):
		game_data = json.dumps(self.game.state)
		#print(f"Sending game state: {game_data}")
		with lock:
			for client in self.game.player_list:
				client.send(game_data)
	
	def start_game_loop(self):
		def game_loop():
			#to do: add a stop to the loop upon reaching a certain score
			while len(self.game.player_list) == 2:
				if self.game.state['scores'][1] >= 2 or self.game.state['scores'][2] >= 2:
					print("Game over")
					if self.game.state['scores'][1] >= 2:
						self.game.match.end(self.game.match.player1)
					else:
						self.game.match.end(self.game.match.player2)
					return
				self.update_game()
				self.send_state()
				time.sleep(0.01)
			if len(self.game.player_list) < 2:
				print("Game paused because a player disconnected.")
				return
		threading.Thread(target=game_loop, daemon=True).start()

#TO DO : link everything together more