from channels.generic.websocket import WebsocketConsumer
from threading import Lock
import json
import time
import threading
from game.services import getMatch

all_game = []
all_game_lock = Lock()

# game
class Game():
	def __init__(self, id, match):
		self.id = id
		self.player_list = []
		self.match = match
		self.p1_id = match.player1.id
		self.p2_id = match.player2.id
		self.turntoplay = self.p1_id
		self.lock = Lock()
		self.moves = 0
		self.draws = 0
		self.state = { 'type': 'gamestate',
			'board': [' ' for _ in range(9)],
			'winner': 0,
			'turn': 'X',
		}
		# Système de vote pour redémarrer
		self.restart_votes = set()

	# Réinitialiser les votes pour redémarrer
	def reset_restart_votes(self):
		self.restart_votes = set()

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
				self.role = "X"
			elif self.id == self.game.p2_id:
				self.role = "O"
			else:
				self.refuse_connection()
				return
			self.game.player_list.append(self)
			self.send_role_to_client()
			# envoyer a l'autre joueurs qu'il se co
			# self.send(json.dumps(self.game.state))
			self.send_state()
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
				self.handle_data(data)
		except json.JSONDecodeError as e:
			print(f"JSON decoding error: {e}")
			self.send(json.dumps({"error": "Invalid JSON format"}))
		except Exception as e:
			print(f"Error in receive: {e}")
			self.send(json.dumps({"error": "Server error"}))

	def handle_data(self, data):
		if "action" in data:
			if data["action"] == "restart_game":
				self.game.restart_votes.add(self.id)
				both_voted = self.game.p1_id in self.game.restart_votes and self.game.p2_id in self.game.restart_votes
				
				if both_voted:
					self.game.draws += 1
					self.game.state['board'] = [' ' for _ in range(9)]
					self.game.state['winner'] = 0
					self.game.state['turn'] = 'X'
					self.game.turntoplay = self.game.p1_id
					self.game.reset_restart_votes()
					self.send_msg({
						'type': 'game_restarted',
						'message': 'Les deux joueurs ont accepté de redémarrer la partie',
					})
					self.send_state()
				else:
					other_player_id = self.game.p2_id if self.id == self.game.p1_id else self.game.p1_id
					waiting_for_player = "X" if other_player_id == self.game.p1_id else "O"
					
					self.send_msg({
						'type': 'restart_vote',
						'message': f'En attente de la confirmation du joueur {waiting_for_player} pour redémarrer',
						'votes': list(self.game.restart_votes)
					})
				return
			
			elif data["action"] == "give_up":
				winner = None
				if self.id == self.game.p1_id:
					winner = self.game.match.player2
					self.game.state['winner'] = 'O'
				else:
					winner = self.game.match.player1
					self.game.state['winner'] = 'X'
				match_data = {'moves': self.game.moves, 'draws': self.game.draws}
				self.game.match.end(winner, match_data)
				
				self.game.reset_restart_votes()
				
				self.send_msg({
					'type': 'game_forfeit',
					'message': 'Un joueur a abandonné la partie',
					'winner': self.game.state['winner']
				})
				self.send_state()
				return
		
		if self.id == self.game.turntoplay:
			move = data['cell']
			if self.game.state['board'][move] == ' ':
				self.game.moves += 1
				self.game.state['board'][move] = self.game.state['turn']
				winner = self.check_winner(self.game.state['board'])
				if winner == 'X' or winner == 'O' or winner == 'n':
					self.game.state['winner'] = winner
					
					self.game.reset_restart_votes()
					
					if winner != 'n':
						if self.id == self.game.match.player1.id:
							match_data = {'moves': self.game.moves, 'draws': self.game.draws}
							self.game.match.end(self.game.match.player1, match_data)
						else:
							match_data = {'moves': self.game.moves, 'draws': self.game.draws}
							self.game.match.end(self.game.match.player2, match_data)
					self.send_state()
					return
				else:
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
		return 'n'
	
	def disconnect(self, code):
		with self.game.lock:
			if self in self.game.player_list:
				self.game.player_list.remove(self)
				self.role = None
			if self.id != self.game.p1_id and self.id != self.game.p2_id:
				return
			if len(self.game.player_list) == 0:
				if self.game in all_game:
					all_game.remove(self.game)
			elif len(self.game.player_list) < 2 and self.game.state['winner'] == 0:
				self.send_msg({'type': 'disconnect', 'message': 'Your opponent left the game'})
				def end_game_timer():
					time.sleep(10)
					with self.game.lock:
						if len(self.game.player_list) < 2:
							if self.game in all_game:
								all_game.remove(self.game)
							self.send_msg({
								'type': 'game_ended', 
								'message': 'Game ended due to opponent not reconnecting'
							})
							if self.id == self.game.match.player1.id :
								match_data = {'moves': self.game.moves, 'draws': self.game.draws}
								self.game.match.end(self.game.match.player2, match_data)
							else:
								match_data = {'moves': self.game.moves, 'draws': self.game.draws}
								self.game.match.end(self.game.match.player1, match_data)
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