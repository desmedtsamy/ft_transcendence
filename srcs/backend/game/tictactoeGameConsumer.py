from channels.generic.websocket import WebsocketConsumer
from threading import Lock
import json
import time
import threading
from game.services import getMatch

all_game = []
lock = Lock()  # thread-safe operations

# game
class Game():
	def __init__(self, id, match):
		self.id = id
		self.player_list = []
		self.match = match
		self.p1_id = match.player1.id
		self.p2_id = match.player2.id
		self.turntoplay = self.p1_id
		self.state = { 'type': 'gamestate',
			'board': [' ' for _ in range(9)],
			'winner': 0,
			'turn': 'X',
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
		print(f"l'id de la game{id} ")
		with lock:
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
				self.role = "X"
			elif self.id == self.game.p2_id:
				self.role = "O"
			else:
				self.refuse_connection()
				return
			self.send_role_to_client()
			# envoyer a l'autre joueurs qu'il se co
			# self.send(json.dumps(self.game.state))
			self.send_state()
		if len(self.game.player_list) < 2:
			print("Waiting for another player to connect ", self.id )
		if len(self.game.player_list) == 2:
			self.send_connection()
			self.send_opponent_connection()

	def refuse_connection(self, reason="Too many players for the game"):
		self.send(json.dumps({"error": reason}))
		self.close()

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
		if self.id == self.game.turntoplay:
			# Si c'est son tour de jouer
			move = data['cell']
			if self.game.state['board'][move] == ' ':  # Si la case est vide
				self.game.state['board'][move] = self.game.state['turn']  # Mise à jour du tableau
				# Vérifier la victoire
				winner = self.check_winner(self.game.state['board'])
				if winner == 'X' or winner == 'O' or winner == 'n':
					self.game.state['winner'] = winner
					# gestion de fin de partie
					self.send_state()
					if self.id == self.game.match.player1.id :
						self.game.match.end(self.game.match.player1)
					elif winner == 'n':
						self.game.match.end(None)
					else:
						self.game.match.end(self.game.match.player2)
					return
				else:
					# Changer le joueur
					self.game.state['turn'] = 'O' if self.game.state['turn'] == 'X' else 'X'
					self.game.turntoplay = self.game.p2_id if self.game.turntoplay == self.game.p1_id else self.game.p1_id
				self.send_state()
			else:
				self.send(json.dumps({"error": "Invalid move, cell already taken!"}))
		else:
			self.send(json.dumps({"error": "Wait for your turn"}))

	def check_winner(self, board):
		winning_combinations = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
		for combination in winning_combinations:
			if board[combination[0]] == board[combination[1]] == board[combination[2]] != ' ':
				return board[combination[0]]
		for x in board:
			if x == ' ':
				return None
		print('match nul')
		return 'n'
	
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
				self.send_msg({'type': 'disconnect', 'message': 'Your opponent left the game'})
				print(f"Game {self.game.id} paused: only {len(self.game.player_list)} player(s) remain.")
				def end_game_timer():
					time.sleep(60)  # Wait for 60 seconds
					with lock:
						if len(self.game.player_list) < 2:  # Check if opponent hasn't reconnected
							if self.game in all_game:
								all_game.remove(self.game)
							# Notify remaining player that game has ended
							self.send_msg({
								'type': 'game_ended', 
								'message': 'Game ended due to opponent not reconnecting'
							})
							if self.id == self.game.match.player1.id :
								self.game.match.end(self.game.match.player2)
							else:
								self.game.match.end(self.game.match.player1)

				# Start the timer in a separate thread
				timer_thread = threading.Thread(target=end_game_timer)
				timer_thread.start()

	def send_state(self):
		game_data = json.dumps(self.game.state)
		for client in self.game.player_list:
			client.send(game_data)

	def send_msg(self, msg):
		msg_json = json.dumps(msg)
		for client in self.game.player_list:
			client.send(msg_json)
	
	def send_connection(self):
		for client in self.game.player_list:
			if client != self:
				client.send(json.dumps({'type' : 'opponent connected'}))
	
	def send_opponent_connection(self):
		self.send(json.dumps({'type' : 'opponent connected'}))