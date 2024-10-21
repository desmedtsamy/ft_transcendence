from channels.generic.websocket import WebsocketConsumer
import json
import threading
import time

connected_clients_notif = {}
connected_clients = {}
ball_position = {'x': 50, 'y': 50}

class NotificationConsumer(WebsocketConsumer):

	def connect(self):
		self.accept()
		print (self.scope['url_route']['kwargs']['user_id'])
		self.user_id = self.scope['url_route']['kwargs']['user_id']
		connected_clients_notif[self.user_id] = self

	def disconnect(self, close_code):
		user_id = self.scope['url_route']['kwargs']['user_id']
		if user_id in connected_clients_notif:
			del connected_clients_notif[user_id]

	def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['message']

		for client in connected_clients_notif.values():
			client.send(text_data=json.dumps({
				'message': message
			}))
			

class PongGameConsumer(WebsocketConsumer):

	def connect(self):
		self.accept()
		self.user_id = self.scope['url_route']['kwargs']['user_id']
		connected_clients[self.user_id] = self
		print(f"User {self.user_id} connected.")

		# Démarrer la mise à jour régulière de la position de la balle
		if len(connected_clients) == 1:  # Démarre la balle si premier joueur
			threading.Thread(target=self.update_ball_position).start()

	def disconnect(self, close_code):
		if self.user_id in connected_clients:
			del connected_clients[self.user_id]

	def receive(self, text_data):
		data = json.loads(text_data)
		
		if data['type'] == 'move':
			# Mise à jour des mouvements du joueur
			player_position = data['position']
			for client_id, client in connected_clients.items():
				if client_id != self.user_id:
					client.send(json.dumps({
						'type': 'player_update',
						'position': player_position
					}))

	def update_ball_position(self):
		global ball_position
		while len(connected_clients) > 0:
			ball_position['x'] += 1
			ball_position['y'] += 1
			if ball_position['x'] > 800 or ball_position['y'] > 600:
				ball_position['x'] = 0
				ball_position['y'] = 0
			# Envoyer la nouvelle position à tous les clients
			for client in connected_clients.values():
				client.send(json.dumps({
					'type': 'ball_update',
					'position': ball_position
				}))

			time.sleep(0.001)