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
connected_clients = {}


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

			# Vérification de l'existence du client dans connected_clients
			if client_id in connected_clients:
				connected_clients[client_id].send(text_data=json.dumps({
					'message': message,
					'name': name,
					"id": id,
					"match_id": match_id,
					"game_type": game_type
				}))
				print(f"Message sent to client: {client_id} {match_id}")
			else:
				print(f"Client ID {client_id} not found in connected_clients")
				print("Currently connected clients:")
				for client_id, consumer in connected_clients.items():
					print(f"Client ID: {client_id}, Consumer: {consumer}")
			if message == "match_accept":
				match = Match.objects.get(id=match_id)
				connected_clients[client_id].send(text_data=json.dumps({
					'message': "match_start",
					'match_id' : match.id,
					'game_type': match.game_type
				}))
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
		if player1 in connected_clients and player2 in connected_clients:
			print("les deux joueurs sont connectés")
			connected_clients[player1].send(text_data=json.dumps({
				'message': "match_request",
				"match_id": match_id,
				"game_type": match.game_type
			}))
			connected_clients[player2].send(text_data=json.dumps({
				'message': "match_request",
				"match_id": match_id,
				"game_type": match.game_type
			}))
		elif player1 in connected_clients:
			print("le joueur 1 est connecté")
			for client in connected_clients:
				print(client)
			#set player1 as winner
			match.end(match.player1)
			connected_clients[player1].send(text_data=json.dumps({
				'message': "you win by default",
				"winner": player1
			}))
		elif player2 in connected_clients:
			print("le joueur 2 est connecté")
			for client in connected_clients:
				print(client)
			match.end(match.player2)
			connected_clients[player2].send(text_data=json.dumps({
				'message': "you win by default",
				"winner": player2
			}))
		else:
			print("aucun joueur n'est connecté")
			match.end(random.choice([match.player1, match.player2]))

