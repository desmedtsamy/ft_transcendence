from channels.generic.websocket import WebsocketConsumer
from threading import Lock
import json
import time
import threading
from game.services import getMatch

connected_client_list = []
lock = Lock()  # thread-safe operations

canvas_width = 800
canvas_height = 600
velocity = 3
paddle_height = 100
paddle_width = 10
ball_size = 10

game_state = {
	'players': {
		1: {'x': 50, 'y': 250},  # left player
		2: {'x': 750, 'y': 250}  # right player
	},
	'ball': {'x': 400, 'y': 300, 'vx': velocity, 'vy': velocity},
	'scores': {1: 0, 2: 0}
}

class Consumer(WebsocketConsumer):

	def connect(self):
		self.accept()
		self.match = getMatch(self.scope['url_route']['kwargs']['game_id'])
		self.id  = int (self.scope['url_route']['kwargs']['user_id'])
		with lock:
			client_to_remove = None
			for client in connected_client_list:
				if client.id == self.id:
					print("Client already connected. Disconnecting the old connection.")
					client_to_remove = client
					break
			if client_to_remove:
				print("Removing client from the list")
				connected_client_list.remove(client_to_remove)
			print("Adding client to the list")
			connected_client_list.append(self)

			if self.id == self.match.player1.id:
				self.role = "left"
			elif self.id == self.match.player2.id:
				self.role = "right"
			else:
				self.refuse_connection()
				return

			# print("connect with role: ", self.role)
			# time.sleep(1)
			self.send_role_to_client()

		if len(connected_client_list) == 2:
			# self.countdown()
			print("Starting the game loop " , self.id)
			self.start_game_loop()
		else:
			print("Waiting for another player to connect ", self.id )

	def refuse_connection(self):
		self.send(json.dumps({"error": "Too many players for the game"}))
		self.close()

	def countdown(self):
		self.send_game_state()
		with lock:
			i = 3
			while i >= 0:
				for client in connected_client_list:
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
				print(f"Received data: {data}")
				self.handle_data(data)
			elif bytes_data:
				print(f"Received bytes data: {bytes_data} {self.id}")
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
			# if  0 <= position['x'] <= canvas_height - paddle_height:
				if self.role == "left":
					print("move_player left")
					game_state['players'][1]['y'] = position['y']
				elif self.role == "right":
					print("move_player right")
					game_state['players'][2]['y'] = position['y']
			# else:
			# 	print("error: wrong position")
		else:
			print("Position data missing")


	def disconnect(self, code):
		with lock:
			if self in connected_client_list:
				connected_client_list.remove(self)
				self.role = None
			if len(connected_client_list) < 2:
				print("A player has disconnected. Pausing the game.")
			# self.send_active_player()
			

	def update_game(self):
		ball = game_state['ball']
		# with lock:
		# 	game_state['active_player'] = len(connected_client_list)
		# 	if game_state['active_player'] < 2:
		# 		return
		left_player = game_state['players'][1]
		right_player = game_state['players'][2]

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
				game_state['scores'][2] += 1  # Right player scores
			else:
				game_state['scores'][1] += 1  # Left player scores
			ball['x'], ball['y'], ball['vx'], ball['vy'] = canvas_width/2, canvas_height/2, velocity, velocity

	def check_collision(self, ball, paddle):
		""" Checks if the ball collides with a given paddle """
		ball_rect = {'x': ball['x'], 'y': ball['y'], 'width': ball_size, 'height': ball_size}
		paddle_rect = {'x': paddle['x'], 'y': paddle['y'], 'width': paddle_width, 'height': paddle_height}

		return (ball_rect['x'] <= paddle_rect['x'] + paddle_rect['width'] and
				ball_rect['x'] + ball_rect['width'] >= paddle_rect['x'] and
				ball_rect['y'] <= paddle_rect['y'] + paddle_rect['height'] and
				ball_rect['y'] + ball_rect['height'] >= paddle_rect['y'])

	def	send_game_state(self):
		game_data = json.dumps(game_state)
		#print(f"Sending game state: {game_data}")
		with lock:
			for client in connected_client_list:
				client.send(game_data)
	
	def start_game_loop(self):
		def game_loop():
			#to do: add a stop to the loop upon reaching a certain score
			while len(connected_client_list) == 2:
				if game_state['scores'][1] >= 15 or game_state['scores'][2] >= 15:
					print("Game over")
					if game_state['scores'][1] >= 15:
						self.match.end(self.match.player1)
					else:
						self.match.end(self.match.player2)
					return
				self.update_game()
				self.send_game_state()
				time.sleep(0.01)
			if len(connected_client_list) < 2:
				print("Game paused because a player disconnected.")
				return
		threading.Thread(target=game_loop, daemon=True).start()

#TO DO : link everything together more