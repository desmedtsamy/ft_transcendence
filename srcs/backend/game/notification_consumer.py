from channels.generic.websocket import WebsocketConsumer
import json
import threading
import time
from django.dispatch import receiver
from game.services import create_match
from .models import Match
from .signals import match_started
import random
from .models import TournamentMatch
from datetime import datetime, timedelta
import asyncio

connected_clients = {}
# Structure pour stocker les notifications en attente
# {user_id: [(timestamp, notification_data), ...]}
pending_notifications = {}

# Fonction pour nettoyer les notifications expirées (plus d'une minute)
def cleanup_notifications():
    current_time = datetime.now()
    for user_id in list(pending_notifications.keys()):
        # Filtrer les notifications qui ont moins d'une minute
        pending_notifications[user_id] = [
            (timestamp, data) for timestamp, data in pending_notifications[user_id]
            if current_time - timestamp < timedelta(minutes=1)
        ]
        # Supprimer la clé si la liste est vide
        if not pending_notifications[user_id]:
            del pending_notifications[user_id]

# Fonction pour stocker une notification
def store_notification(user_id, notification_data):
    if user_id not in pending_notifications:
        pending_notifications[user_id] = []
    # Ajouter le timestamp et les données
    pending_notifications[user_id].append((datetime.now(), notification_data))

@receiver(match_started)
def handle_match_started(sender, **kwargs):
	player1_id = kwargs['player1_id']
	player2_id = kwargs['player2_id']
	match= kwargs['match']
	NotificationConsumer.start_match(player1_id, player2_id, match)

class NotificationConsumer(WebsocketConsumer):

	def connect(self):
		self.accept()
		print (self.scope['url_route']['kwargs']['user_id'])
		self.user_id = int (self.scope['url_route']['kwargs']['user_id'])
		connected_clients[self.user_id] = self
        
		# Vérifier si l'utilisateur a des notifications en attente
		if self.user_id in pending_notifications:
			# Nettoyer d'abord les notifications expirées
			cleanup_notifications()
			# Envoyer les notifications en attente s'il en reste
			if self.user_id in pending_notifications:
				for timestamp, notification_data in pending_notifications[self.user_id]:
					self.send(text_data=json.dumps(notification_data))
				# Supprimer les notifications envoyées
				del pending_notifications[self.user_id]
                
	def disconnect(self, close_code):
		user_id = self.scope['url_route']['kwargs']['user_id']
		if user_id in connected_clients:
			del connected_clients[user_id]

	def receive(self, text_data):
		try:
			data_json = json.loads(text_data)
			if(data_json['client_id']):
				client_id = int(data_json['client_id'])
			match_id = data_json['match_id']
			game_type = data_json['game_type']
			message = data_json['message']
			name = data_json['name']
			id = data_json['id']

			# Préparation des données de notification
			notification_data = {
				'message': message,
				'name': name,
				"id": id,
				"match_id": match_id,
				"game_type": game_type
			}

			# Vérification de l'existence du client dans connected_clients
			if client_id in connected_clients:
				connected_clients[client_id].send(text_data=json.dumps(notification_data))
				print(f"Message sent to client: {client_id} {match_id}")
			else:
				print(f"Client ID {client_id} not found in connected_clients")
				print("Currently connected clients:")
				for client_id, consumer in connected_clients.items():
					print(f"Client ID: {client_id}, Consumer: {consumer}")
				# Stocker la notification pour une livraison ultérieure
				store_notification(client_id, notification_data)
				print(f"Notification stored for client: {client_id}")
                
			if message == "match_accept":
				match = Match.objects.get(id=match_id)
				if client_id in connected_clients:
					connected_clients[client_id].send(text_data=json.dumps({
						'message': "match_start",
						'match_id' : match.id,
						'game_type': match.game_type
					}))
				else:
					# Stocker cette notification pour une livraison ultérieure
					store_notification(client_id, {
						'message': "match_start",
						'match_id' : match.id,
						'game_type': match.game_type
					})
			elif message == "match_decline":
				print("le mec a dit non")
				tournament_match = TournamentMatch.objects.get(match_id=match_id)
				print("on trouve pas le match de tournoi")
				if tournament_match:
					print("et c'est un match de tournoi")
					opponent = tournament_match.match.player2 if client_id == tournament_match.match.player1.id else tournament_match.match.player1
					Match.objects.get(id=match_id).end(opponent)
				else:
					print("et c'est un match normal")
					Match.objects.get(id=match_id).delete()
			else:
				print("message invalide " + message)
		except json.JSONDecodeError as e:
			print(f"JSON decoding error: {e}")
		except Exception as e:
			print(f"Error in receive method: {e}")
            
	@staticmethod
	def start_match(player1, player2, match):
		match_id = match.id
		notification_data = {
			'message': "match_request",
			"match_id": match_id,
			"game_type": match.game_type
		}
        
		# Vérifier et envoyer/stocker pour les deux joueurs
		player1_connected = player1 in connected_clients
		player2_connected = player2 in connected_clients
        
		if player1_connected and player2_connected:
			print("les deux joueurs sont connectés")
			connected_clients[player1].send(text_data=json.dumps(notification_data))
			connected_clients[player2].send(text_data=json.dumps(notification_data))
		elif player1_connected:
			print("le joueur 1 est connecté")
			for client in connected_clients:
				print(client)
			#set player1 as winner
			match.end(match.player1)
			connected_clients[player1].send(text_data=json.dumps({
				'message': "you win by default",
				"winner": player1
			}))
			# Stocker une notification pour player2 même s'il a perdu par défaut
			store_notification(player2, {
				'message': "match_lost_by_default",
				"winner": player1,
				"match_id": match_id
			})
		elif player2_connected:
			print("le joueur 2 est connecté")
			for client in connected_clients:
				print(client)
			match.end(match.player2)
			connected_clients[player2].send(text_data=json.dumps({
				'message': "you win by default",
				"winner": player2
			}))
			# Stocker une notification pour player1 même s'il a perdu par défaut
			store_notification(player1, {
				'message': "match_lost_by_default",
				"winner": player2,
				"match_id": match_id
			})
		else:
			print("aucun joueur n'est connecté")
			winner = random.choice([match.player1, match.player2])
			loser = match.player2 if winner == match.player1 else match.player1
			match.end(winner)
			# Stocker des notifications pour les deux joueurs
			store_notification(winner.id, {
				'message': "you win by default",
				"winner": winner.id,
				"match_id": match_id
			})
			store_notification(loser.id, {
				'message': "match_lost_by_default",
				"winner": winner.id,
				"match_id": match_id
			})

