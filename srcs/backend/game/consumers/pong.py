from channels.generic.websocket import WebsocketConsumer
from threading import Lock, Event
import json
import time
import threading
import random
from game.services import getMatch

all_game = []
all_game_lock = Lock()

# Game options
velocity = 6
canvas_width = 800
canvas_height = 400
paddle_height = 100
paddle_width = 10
ball_size = 10
MAXSCORE = 5

class Game:
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
		self.game_loop_start_lock = Lock()
		self.time_total = 0
		self.state = {
			'type': 'gamestate',
			'players': {
				1: {'x': 50, 'y': 150},  # Left player
				2: {'x': 750, 'y': 150}  # Right player
			},
			'ball': {'x': 400, 'y': 300, 'vx': random_velocity(), 'vy': random_velocity()},
			'scores': {1: 0, 2: 0},
			'winner': 0
		}
		self.disconnect_event = Event()  # To signal reconnection
		self.disconnect_timer_active = False
		self.game_ended = False

class Consumer(WebsocketConsumer):
	def getGame(self):
		match = getMatch(self.scope['url_route']['kwargs']['game_id'])
		if match.status == 'finished':
			self.send_try(json.dumps({
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
		self.id = int(self.scope['url_route']['kwargs']['user_id'])
		self.game = self.getGame()
		with self.game.lock:
			# Remove any existing connection for this player
			player_to_remove = None
			for player in self.game.player_list:
				if player.id == self.id:
					player_to_remove = player
					break
			if player_to_remove:
				self.game.player_list.remove(player_to_remove)

			# Verify if the client is a match member and add them
			if self.id == self.game.p1_id:
				self.role = "left"
			elif self.id == self.game.p2_id:
				self.role = "right"
			else:
				self.refuse_connection()
				return
			self.game.player_list.append(self)

			# Signal reconnection to stop any active disconnect timer
			self.game.disconnect_event.set()
			self.game.disconnect_timer_active = False

			self.send_role_to_client()
			self.send_connection()

		if len(self.game.player_list) == 1 and not self.game.game_ended:
			def check_match_status():
				self.send_try(json.dumps({'type': 'waiting'}))
				while True:
					match = getMatch(self.scope['url_route']['kwargs']['game_id'])
					if match.status == 'finished':
						self.send_try(json.dumps({'type': 'redirect', 'message': 'Match is finished','url': '/'}))
						self.game.game_ended = True
						self.close()
						break
					with self.game.lock:
						if len(self.game.player_list) == 2:
							break
					time.sleep(1)
			threading.Thread(target=check_match_status, daemon=True).start()

		# Start or resume the game if both players are connected
		if len(self.game.player_list) == 2 and not self.game.game_ended:
			with self.game.game_loop_start_lock:
				if not self.game.is_running:
					self.game.is_running = True
					self.countdown()
					self.start_game_loop()

	def refuse_connection(self, reason="Too many players for the game"):
		self.send_try(json.dumps({"error": reason}))
		self.close()

	def countdown(self):
		self.send_state()
		i = 3
		while i >= 0:
			for client in self.game.player_list:
				client.send_try(json.dumps({"countdown": i}))
			if i > 0:
				time.sleep(1)
			i -= 1

	def send_role_to_client(self):
		if self.id == self.game.p1_id:
			self.send_try(json.dumps({
				'type': 'role',
				'role': "left",
				'player1': self.game.p1_name,
				'player2': self.game.p2_name,
			}))
		else:
			self.send_try(json.dumps({
				'type': 'role',
				'role': "left",
				'player1': self.game.p2_name,
				'player2': self.game.p1_name,
			}))

	def receive(self, text_data=None, bytes_data=None):
		try:
			if text_data:
				data = json.loads(text_data)
				self.handle_data(data)
		except json.JSONDecodeError as e:
			print(f"JSON decoding error: {e}")
			self.send_try(json.dumps({"error": "Invalid JSON format"}))
		except Exception as e:
			print(f"Error in receive: {e}")
			self.send_try(json.dumps({"error": "Server error"}))

	def handle_data(self, data):
		if data.get('type') == 'move':
			self.move_player(data)

	def move_player(self, data):
		position = data.get('position')
		if position is not None and 0 <= position['y'] <= canvas_height - paddle_height:
			if self.id == self.game.p1_id:
				self.game.state['players'][1]['y'] = position['y']
			else:
				self.game.state['players'][2]['y'] = position['y']

	def disconnect(self, code):
		with self.game.lock:
			if self in self.game.player_list:
				self.game.player_list.remove(self)
				self.role = None
			if self.id not in (self.game.p1_id, self.game.p2_id):
				return
			if len(self.game.player_list) == 0:
				if self.game in all_game:
					all_game.remove(self.game)
				self.game.disconnect_event.set()  # Stop any running timer
				self.game.disconnect_timer_active = False
				if not self.game.game_ended:
					match_data = {'duration': int(self.game.time_total), 'scores': self.game.state['scores']}
					self.game.match.end(None, match_data)  # End match with no winner
					self.game.game_ended = True
			elif len(self.game.player_list) < 2 and self.game.state['winner'] == 0:
				self.send_msg({'type': 'disconnect', 'message': 'Your opponent left the game'})
				# Start the disconnect timer only if not already active
				if not self.game.disconnect_timer_active:
					self.game.disconnect_event.clear()  # Reset the event
					self.game.disconnect_timer_active = True
					self.send_msg({'type': 'disconnect', 'message': 'Your opponent left the game'})
					timer_thread = threading.Thread(target=self.end_game_timer)
					timer_thread.start()

	def end_game_timer(self):
		timeout = 30  # Wait for 30 seconds
		start_time = time.time()
		while time.time() - start_time < timeout:
			if self.game.disconnect_event.wait(timeout=1):  # Check for reconnection every second
				# If a player reconnects, abort the timer
				with self.game.lock:
					self.game.disconnect_timer_active = False
					if len(self.game.player_list) == 2 and not self.game.is_running:
						self.game.is_running = True
						self.start_game_loop()
					elif len(self.game.player_list) == 0:
						return
				return
			# Update remaining time to clients
			remaining_time = int(timeout - (time.time() - start_time))
			with self.game.lock:
				for client in self.game.player_list:
					client.send_try(json.dumps({'type': 'disconnect_countdown', 'time_left': remaining_time}))

		# If timeout is reached and no reconnection
		with self.game.lock:
			if len(self.game.player_list) < 2 and self.game.state['winner'] == 0 and not self.game.game_ended:
				if self.game in all_game:
					all_game.remove(self.game)
				if len(self.game.player_list) > 0:
					self.send_msg({
						'type': 'game_ended',
						'message': 'Game ended due to opponent not reconnecting'
					})
					remaining_player = self.game.player_list[0]
					winner = self.game.match.player1 if remaining_player.id == self.game.p1_id else self.game.match.player2
					match_data = {'duration': int(self.game.time_total), 'scores': self.game.state['scores']}
					self.game.match.end(winner, match_data)
					self.game.game_ended = True
			self.game.disconnect_timer_active = False

	def update_game(self):
		ball = self.game.state['ball']
		left_player = self.game.state['players'][1]
		right_player = self.game.state['players'][2]

		ball['x'] += ball['vx']
		ball['y'] += ball['vy']

		if ball['y'] - ball_size <= 0 or ball['y'] + ball_size >= canvas_height:
			ball['vy'] = -ball['vy']

		if self.check_collision(ball, left_player):
			ball['vx'] = -ball['vx']
			ball['x'] = left_player['x'] + paddle_width + ball_size
			hit_height = ball['y'] - left_player['y']
			if hit_height < 15:
				ball['vy'] = velocity
			elif hit_height > 85:
				ball['vy'] = -velocity

		if self.check_collision(ball, right_player):
			ball['vx'] = -ball['vx']
			ball['x'] = right_player['x'] - paddle_width
			hit_height = ball['y'] - right_player['y']
			if hit_height < 15:
				ball['vy'] = velocity
			elif hit_height > 85:
				ball['vy'] = -velocity

		if ball['x'] <= 0 or ball['x'] >= canvas_width:
			if ball['x'] <= 0:
				self.game.state['scores'][2] += 1  # Right player scores
			else:
				self.game.state['scores'][1] += 1  # Left player scores
			ball['x'], ball['y'], ball['vx'], ball['vy'] = canvas_width/2, canvas_height/2, random_velocity(), random_velocity()

	def check_collision(self, ball, paddle):
		ball_rect = {'x': ball['x'], 'y': ball['y'], 'width': ball_size, 'height': ball_size}
		paddle_rect = {'x': paddle['x'], 'y': paddle['y'], 'width': paddle_width, 'height': paddle_height}
		return (ball_rect['x'] <= paddle_rect['x'] + paddle_rect['width'] and
				ball_rect['x'] + ball_rect['width'] >= paddle_rect['x'] and
				ball_rect['y'] <= paddle_rect['y'] + paddle_rect['height'] and
				ball_rect['y'] + ball_rect['height'] >= paddle_rect['y'])

	def send_state(self):
		with self.game.lock:
			for client in self.game.player_list:
				if client.id == self.game.p1_id:
					client.send_try(json.dumps(self.game.state))
				elif client.id == self.game.p2_id:
					inverted_state = {
						'type': 'gamestate',
						'players': {
							1: {'x': 50, 'y': self.game.state['players'][2]['y']},
							2: {'x': 750, 'y': self.game.state['players'][1]['y']}
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
					client.send_try(json.dumps(inverted_state))

	def send_msg(self, msg):
		msg_json = json.dumps(msg)
		for client in self.game.player_list:
			client.send_try(msg_json)

	def send_connection(self):
		for client in self.game.player_list:
			if client != self:
				client.send_try(json.dumps({'type': 'opponent connected'}))

	def send_try(self, arg):
		try:
			self.send(arg)
		except :
			print('problem sending to self')

	def start_game_loop(self):
		start_time = time.time()
		def game_loop():
			self.game.match.status = "started"
			self.game.match.save()
			while len(self.game.player_list) == 2:
				if self.game.state['scores'][1] >= MAXSCORE or self.game.state['scores'][2] >= MAXSCORE:
					self.game.time_total += time.time() - start_time
					if self.game.state['scores'][1] >= MAXSCORE:
						self.game.state['winner'] = self.game.p1_id
						self.send_state()
						match_data = {'duration': int(self.game.time_total), 'scores': self.game.state['scores']}
						self.game.game_ended = True
						self.game.match.end(self.game.match.player1, match_data)
						self.game.game_ended = True
					else:
						self.game.state['winner'] = self.game.p2_id
						self.send_state()
						match_data = {'duration': int(self.game.time_total), 'scores': self.game.state['scores']}
						self.game.game_ended = True
						self.game.match.end(self.game.match.player2, match_data)
						self.game.game_ended = True
					return
				self.update_game()
				self.send_state()
				time.sleep(0.0155)
			if len(self.game.player_list) < 2:
				with self.game.game_loop_start_lock:
					self.game.is_running = False
				self.game.time_total += time.time() - start_time
		threading.Thread(target=game_loop, daemon=True).start()

def random_velocity():
	rint = random.randint(1, 2)
	return velocity if rint == 1 else -velocity