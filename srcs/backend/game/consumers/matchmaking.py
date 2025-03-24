from channels.generic.websocket import WebsocketConsumer
from threading import Lock
import json
import time
import threading
from game.services import create_match
from account.models import User
from django.contrib.auth import get_user_model

# Queue for players waiting for a match
waiting_players = []
# Lock to protect access to the queue
queue_lock = Lock()
# Délai d'attente minimal avant de chercher un match (en secondes)
MATCHMAKING_DELAY = 5
# Fenêtre de score maximum pour un match immédiat (si différence inférieure, on match tout de suite)
MAX_SCORE_DIFF_FOR_IMMEDIATE_MATCH = 42

class Consumer(WebsocketConsumer):
	def connect(self):
		self.accept()
		self.id = int(self.scope['url_route']['kwargs']['user_id'])
		self.matchmaking_timer = None

	def receive(self, text_data=None, bytes_data=None):
		data = json.loads(text_data)
		
		if data.get('action') == 'find_match':
			game_type = data.get('game_type', 'pong')
			self.find_match(game_type)
		elif data.get('action') == 'cancel_matchmaking':
			self.cancel_matchmaking()

	def disconnect(self, code):
		self.cancel_matchmaking()
		if self.matchmaking_timer:
			self.matchmaking_timer.cancel()

	def find_match(self, game_type='pong'):
		try:
			# Récupérer l'utilisateur et son score pour le jeu sélectionné
			User = get_user_model()
			current_user = User.objects.get(id=self.id)
			current_score = current_user.scores.get(game_type, 0)
			
			player_info = {
				'id': self.id,
				'consumer': self,
				'game_type': game_type,
				'score': current_score,
				'join_time': time.time()  # Ajouter un timestamp pour savoir quand le joueur a rejoint la file
			}
			
			match_found = False
			
			with queue_lock:
				if len(waiting_players) > 0:
					# Filtre des joueurs en attente pour le même type de jeu (mais pas le joueur actuel)
					eligible_players = [p for p in waiting_players if p['game_type'] == game_type and p['id'] != self.id]
					
					if eligible_players:
						# D'abord, essayons de trouver un joueur avec une différence de score très faible
						for player in eligible_players:
							if abs(player['score'] - current_score) <= MAX_SCORE_DIFF_FOR_IMMEDIATE_MATCH:
								match_found = self.create_match_with_player(player, current_score, game_type)
								if match_found:
									break
				
				# Si aucun match n'a été trouvé, ajouter le joueur à la file d'attente
				if not match_found:
					waiting_players.append(player_info)
					self.send(text_data=json.dumps({
						'action': 'waiting_for_opponent',
						'message': f'Looking for an opponent with similar skill level... (Waiting for {MATCHMAKING_DELAY} seconds)'
					}))
					
					# Programmer une vérification différée pour ce joueur
					self.matchmaking_timer = threading.Timer(MATCHMAKING_DELAY, self.delayed_matchmaking, args=[game_type, current_score])
					self.matchmaking_timer.daemon = True
					self.matchmaking_timer.start()
		
		except User.DoesNotExist:
			print(f"User with ID {self.id} does not exist")
			self.send(text_data=json.dumps({
				'action': 'error',
				'message': 'User not found'
			}))
		except Exception as e:
			print(f"Error in matchmaking: {str(e)}")
			self.send(text_data=json.dumps({
				'action': 'error',
				'message': f'An error occurred: {str(e)}'
			}))

	def delayed_matchmaking(self, game_type, current_score):
		"""Cette fonction est appelée après le délai d'attente pour trouver le meilleur match possible"""
		with queue_lock:
			# Vérifier d'abord si le joueur est toujours dans la file d'attente
			current_player = None
			for player in waiting_players:
				if player['id'] == self.id:
					current_player = player
					break
			
			if not current_player:
				# Le joueur a été apparié ou a quitté la file d'attente
				return
			
			# Filtre des joueurs en attente pour le même type de jeu (mais pas le joueur actuel)
			eligible_players = [p for p in waiting_players if p['game_type'] == game_type and p['id'] != self.id]
			
			if eligible_players:
				# Trouver le joueur avec le score le plus proche
				closest_player = min(eligible_players, key=lambda p: abs(p['score'] - current_score))
				
				# Créer le match
				self.create_match_with_player(closest_player, current_score, game_type)
	
	def create_match_with_player(self, opponent, current_score, game_type):
		"""Crée un match avec l'adversaire spécifié et envoie les notifications aux deux joueurs"""
		opponent_id = opponent['id']
		opponent_consumer = opponent['consumer']
		
		# Créer le match
		match = create_match(self.id, opponent_id, game_type)
		waiting_players.remove(opponent)
		match.start("matchmaking")
		# Retirer aussi le joueur actuel s'il est dans la file
		current_player = None
		for player in waiting_players:
			if player['id'] == self.id:
				current_player = player
				break
		
		if current_player:
			waiting_players.remove(current_player)
		
		# Annuler le timer si encore actif
		if self.matchmaking_timer:
			self.matchmaking_timer.cancel()
		
		return True

	def cancel_matchmaking(self):
		with queue_lock:
			for i, player in enumerate(waiting_players):
				if player['id'] == self.id:
					waiting_players.pop(i)
					break
		
		# Annuler le timer si existant
		if hasattr(self, 'matchmaking_timer') and self.matchmaking_timer:
			self.matchmaking_timer.cancel()
			
		# Déconnecter l'utilisateur
		self.close()