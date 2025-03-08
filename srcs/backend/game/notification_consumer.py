from channels.generic.websocket import WebsocketConsumer
import json
import threading
import time
from django.dispatch import receiver
from game.services import create_match
from .models import Match
from .signals import match_started
connected_clients = {}


@receiver(match_started)
def handle_match_started(sender, **kwargs):
	player1_id = kwargs['player1_id']
	player2_id = kwargs['player2_id']
	match_id = kwargs['match_id']
	NotificationConsumer.start_match(player1_id, player2_id, match_id)

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

			print(data_json)
			print("pipi")
			if(data_json['client_id']):
				client_id = int(data_json['client_id'])
			print("caca")
			match_id = data_json['match_id']
			message = data_json['message']
			name = data_json['name']
			id = data_json['id']

			print("caca")
			# Vérification de l'existence du client dans connected_clients
			if client_id in connected_clients:
				connected_clients[client_id].send(text_data=json.dumps({
					'message': message,
					'name': name,
					"id": id
				}))
				print(f"Message sent to client: {client_id}")
			else:
				print(f"Client ID {client_id} not found in connected_clients")
				print("Currently connected clients:")
				for client_id, consumer in connected_clients.items():
					print(f"Client ID: {client_id}, Consumer: {consumer}")
			if message == "match_accept":
				if match_id == 0:
					match_id = create_match(id, client_id)
					print (match_id)
					if match_id == -1:
						return
				# match = Match.objects.get(id=match_id)
				# match.start()
				connected_clients[client_id].send(text_data=json.dumps({
					'message': "match_start",
					'match_id' : str(match_id)
				}))
				connected_clients[id].send(text_data=json.dumps({
					'message': "match_start",
					'match_id' : str(match_id)
				}))
		except json.JSONDecodeError as e:
			print(f"JSON decoding error: {e}")
		except Exception as e:
			print(f"Error in receive method: {e}")
	@staticmethod
	def start_match(player1, player2, match_id):
		if player1 in connected_clients and player2 in connected_clients:
			print(f"Starting match between {player1} and {player2}")
			connected_clients[player1].send(text_data=json.dumps({
				'message': "match_request",
				"match_id": match_id,
				"id": player2
			}))
			connected_clients[player2].send(text_data=json.dumps({
				'message': "match_request",
				"match_id": match_id,
				"id": player2
			}))
		else:
			print(f"Player {player1} or {player2} not connected")
			print("Currently connected clients:")
			for client_id, consumer in connected_clients.items():
				print(f"Client ID: {client_id}, Consumer: {consumer}")