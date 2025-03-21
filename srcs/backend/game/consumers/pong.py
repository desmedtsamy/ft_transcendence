from channels.generic.websocket import WebsocketConsumer
from threading import Lock
import json
import time
import threading
import random
from game.services import getMatch

all_game = []
all_game_lock = Lock()

# options a faire d'ou les variables
velocity = 3
canvas_width = 800
canvas_height = 400
paddle_height = 100
paddle_width = 10
ball_size = 10
MAXSCORE = 5

# game
class Game():
	def __init__(self, id, match):
		self.id = id
		self.player_list = []
		self.match = match
		self.p1_id = match.player1.id
		self.p2_id = match.player2.id
		self.p1_name = match.player1.username
		self.p2_name = match.player2.username
		self.is_running = False
		self.lock = Lock()
		self.time_total = 0
		self.state = { 'type': 'gamestate',
			'players': {
				1: {'x': 50, 'y': 150},  # left player
				2: {'x': 750, 'y': 150}  # right player
			},
			'ball': {'x': 400, 'y': 300, 'vx': random_velocity(), 'vy': random_velocity()},
			'scores': {1: 0, 2: 0},
			'winner': 0
		}

class Consumer(WebsocketConsumer):

	def getGame(self):
		match = getMatch(self.scope['url_route']['kwargs']['game_id'])
		if (match.status == 'finished'):
			# redirige
			self.send(json.dumps({
			'type': 'redirect',
			'message': 'Match is finished',
			'url': '/'
		}))
		id = match.id
		with all_game_lock:
			for game in all_game:
				if game.id == id:
					return game
			game = Game(id, match)
			all_game.append(game)
			return game

	def connect(self):
		self.accept()
		self.id  = int (self.scope['url_route']['kwargs']['user_id'])
		print("user ", self.id, " se connect")
		#ajouter la game
		self.game = self.getGame()
		with self.game.lock:
			# verifie si le joueur a deja une connection existante
			player_to_remove = None
			for player in self.game.player_list:
				if player.id == self.id:
					player_to_remove = player
					break
			if player_to_remove:
				self.game.player_list.remove(player_to_remove)
			
			# verifie si le client est un membre du match et l'ajoute
			if self.id == self.game.p1_id:
				self.role = "left"
			elif self.id == self.game.p2_id:
				self.role = "right"
			else:
				self.refuse_connection()
				return
			self.game.player_list.append(self)

			self.send_role_to_client()
			self.send_connection()

		if len(self.game.player_list) == 2:
			if self.game.is_running == False:
				self.game.is_running = True
				self.countdown()
				self.start_game_loop()

	def refuse_connection(self, reason="Too many players for the game"):
		self.send(json.dumps({"error": reason}))
		self.close()

	def countdown(self):
		self.send_state()
		i = 3
		while i >= 0:
			with self.game.lock:
				for client in self.game.player_list:
					client.send(json.dumps({"countdown" : i}))
			if i > 0:
				time.sleep(1)
			i -= 1

	def send_role_to_client(self):
		""" Send the player's role to the client - always as left """
		# Déterminer qui est l'adversaire basé sur l'ID du joueur actuel
		if self.id == self.game.p1_id:
			# Joueur 1 - lui et son adversaire gardent leurs noms
			self.send(json.dumps({
				'type': 'role',
				'role': "left",  # Toujours à gauche
				'player1': self.game.p1_name,  # Son nom (joueur actuel)
				'player2': self.game.p2_name,  # Nom de l'adversaire
			}))
		else:
			# Joueur 2 - les noms sont inversés pour qu'il se voie comme joueur1
			self.send(json.dumps({
				'type': 'role',
				'role': "left",  # Toujours à gauche
				'player1': self.game.p2_name,  # Son nom (joueur actuel)
				'player2': self.game.p1_name,  # Nom de l'adversaire
			}))

	def receive(self, text_data=None, bytes_data=None):
		try:
			if text_data:
				data = json.loads(text_data)
				self.handle_data(data)
		except json.JSONDecodeError as e:
			print(f"JSON decoding error: {e}")
			self.send(json.dumps({"error": "Invalid JSON format"}))
		except Exception as e:
			print(f"Error in receive: {e}")
			self.send(json.dumps({"error": "Server error"}))

	def handle_data(self, data):
		if data.get('type') == 'move':
			self.move_player(data)
	
	def move_player(self, data):
		position = data.get('position')
		if position is not None:
			if 0 <= position['y'] <= canvas_height - paddle_height:
				# Mise à jour de la position selon l'ID du joueur
				if self.id == self.game.p1_id:
					self.game.state['players'][1]['y'] = position['y']
				else:
					self.game.state['players'][2]['y'] = position['y']

	def disconnect(self, code):
		print("l'utilisateur ", self, " se deco")
		with self.game.lock:
			if self in self.game.player_list:
				self.game.player_list.remove(self)
				self.role = None
			if self.id != self.game.p1_id and self.id != self.game.p2_id:
				return
			if len(self.game.player_list) == 0:
				if self.id == self.game.match.player1.id :
					match_data = {'duration': int(self.game.time_total), 'scores': self.game.state['scores']}
					self.game.match.end(self.game.match.player2, match_data)
				else:
					match_data = {'duration': int(self.game.time_total), 'scores': self.game.state['scores']}
					self.game.match.end(self.game.match.player1, match_data)
				if self.game in all_game:
					all_game.remove(self.game)
			elif len(self.game.player_list) < 2 and self.game.state['winner'] == 0:
				self.send_msg({'type': 'disconnect', 'message': 'Your opponent left the game'})
				def end_game_timer():
					time.sleep(30)  # Wait for 30 seconds
					with self.game.lock:
						if len(self.game.player_list) < 2:  # Check if opponent hasn't reconnected
							if self.game in all_game:
								all_game.remove(self.game)
							# Notify remaining player that game has ended
							self.send_msg({
								'type': 'game_ended', 
								'message': 'Game ended due to opponent not reconnecting'
							})
							if self.id == self.game.match.player1.id :
								match_data = {'duration': int(self.game.time_total), 'scores': self.game.state['scores']}
								self.game.match.end(self.game.match.player2, match_data)
							else:
								match_data = {'duration': int(self.game.time_total), 'scores': self.game.state['scores']}
								self.game.match.end(self.game.match.player1, match_data)
				timer_thread = threading.Thread(target=end_game_timer)
				timer_thread.start()

	def update_game(self):
		ball = self.game.state['ball']
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
			hit_height = ball['y'] - left_player['y']
			if hit_height < 15:
				ball['vy'] = velocity
			elif hit_height > 85:
				ball['vy'] = -velocity

		# Collision with right player's paddle
		if self.check_collision(ball, right_player):
			ball['vx'] = -ball['vx']
			ball['x'] = right_player['x'] - paddle_width
			hit_height = ball['y'] - right_player['y']
			if hit_height < 15:
				ball['vy'] = velocity
			elif hit_height > 85:
				ball['vy'] = -velocity

		# Reset ball if it goes beyond the left or right bounds
		if ball['x'] <= 0 or ball['x'] >= canvas_width:
			if ball['x'] <= 0:
				self.game.state['scores'][2] += 1  # Right player scores
			else:
				self.game.state['scores'][1] += 1  # Left player scores
			ball['x'], ball['y'], ball['vx'], ball['vy'] = canvas_width/2, canvas_height/2, random_velocity(), random_velocity()

	def check_collision(self, ball, paddle):
		""" Checks if the ball collides with a given paddle """
		ball_rect = {'x': ball['x'], 'y': ball['y'], 'width': ball_size, 'height': ball_size}
		paddle_rect = {'x': paddle['x'], 'y': paddle['y'], 'width': paddle_width, 'height': paddle_height}

		return (ball_rect['x'] <= paddle_rect['x'] + paddle_rect['width'] and
				ball_rect['x'] + ball_rect['width'] >= paddle_rect['x'] and
				ball_rect['y'] <= paddle_rect['y'] + paddle_rect['height'] and
				ball_rect['y'] + ball_rect['height'] >= paddle_rect['y'])

	def send_state(self):
		with self.game.lock:
			for client in self.game.player_list:
				# Créer une copie de l'état du jeu adaptée à chaque joueur
				if client.id == self.game.p1_id:
					# Joueur 1 reçoit l'état normal
					client.send(json.dumps(self.game.state))
				else:
					# Joueur 2 reçoit l'état inversé
					inverted_state = {
						'type': 'gamestate',
						'players': {
							# Le joueur 2 se voit à gauche (position 1)
							1: {
								'x': 50,
								'y': self.game.state['players'][2]['y']
							},
							# Le joueur 1 est vu à droite (position 2)
							2: {
								'x': 750,
								'y': self.game.state['players'][1]['y']
							}
						},
						'ball': {
							'x': canvas_width - self.game.state['ball']['x'],
							'y': self.game.state['ball']['y'],
							'vx': -self.game.state['ball']['vx'],
							'vy': self.game.state['ball']['vy']
						},
						'scores': {
							1: self.game.state['scores'][2],
							2: self.game.state['scores'][1]
						},
						'winner': self.game.state['winner']
					}
					client.send(json.dumps(inverted_state))

	def send_msg(self, msg):
		msg_json = json.dumps(msg)
		for client in self.game.player_list:
			client.send(msg_json)
	
	def send_connection(self):
		for client in self.game.player_list:
			if client != self:
				client.send(json.dumps({'type' : 'opponent connected'}))
	
	def start_game_loop(self):
		start_time = time.time()
		def game_loop():
			self.game.match.status = "started"
			self.game.match.save()
			#to do: add a stop to the loop upon reaching a certain score
			while len(self.game.player_list) == 2:
				if self.game.state['scores'][1] >= MAXSCORE or self.game.state['scores'][2] >= MAXSCORE:
					self.game.time_total += time.time() - start_time
					if self.game.state['scores'][1] >= MAXSCORE:
						self.game.state['winner'] = self.game.p1_id
						self.send_state()
						match_data = {'duration': int(self.game.time_total), 'scores': self.game.state['scores']}
						self.game.match.end(self.game.match.player1, match_data)
					else:
						self.game.state['winner'] = self.game.p2_id
						self.send_state()
						match_data = {'duration': int(self.game.time_total), 'scores': self.game.state['scores']}
						self.game.match.end(self.game.match.player2, match_data)
					return
				self.update_game()
				self.send_state()
				time.sleep(0.0155)
			if len(self.game.player_list) < 2:
				self.game.is_running = False
				self.game.time_total += time.time() - start_time
				return
		threading.Thread(target=game_loop, daemon=True).start()

def random_velocity():
	rint = random.randint(1,2)
	return velocity if rint == 1 else -velocity
