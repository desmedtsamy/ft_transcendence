from channels.generic.websocket import WebsocketConsumer
import json
import threading
import time
from pong.services import create_match
connected_clients = {}

class NotificationConsumer(WebsocketConsumer):

	def connect(self):
		self.accept()
		print (self.scope['url_route']['kwargs']['user_id'])
		self.user_id = int (self.scope['url_route']['kwargs']['user_id'])
		connected_clients[self.user_id] = self
		print(self.user_id)
		print(connected_clients[self.user_id])
	def disconnect(self, close_code):
		user_id = self.scope['url_route']['kwargs']['user_id']
		if user_id in connected_clients:
			del connected_clients[user_id]

	def receive(self, text_data):
		try:
			data_json = json.loads(text_data)

			# Validation du client_id
			if 'client_id' not in data_json:
				print("Error: 'client_id' is missing in the received data")
				print(data_json)
				return
			if 'message' not in data_json:
				print("Error: 'message' is missing in the received data")
				print(data_json)
				return
			if 'name' not in data_json:
				print("Error: 'name' is missing in the received data")
				print(data_json)
				return

			if 'id' not in data_json:
				print("Error: 'id' is missing in the received data")
				print(data_json)
				return

			print(data_json)
			client_id = int(data_json['client_id'])
			message = data_json['message']
			name = data_json['name']
			id = data_json['id']

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
				match_id = create_match(id, client_id)
				print (match_id)
				if match_id == -1:
					return
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

