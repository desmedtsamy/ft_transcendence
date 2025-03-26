from datetime import datetime, timedelta
import json
import logging
import random
import threading
import time

from django.dispatch import receiver
from channels.generic.websocket import WebsocketConsumer

from account.models import User
from game.services import create_match
from game.models import Match, TournamentMatch
from game.signals import match_started
from account.signals import friend_request_created

# Configuration du logger
logger = logging.getLogger(__name__)

class NotificationManager:
	
	def __init__(self):
		self.connected_clients = {}
		self.pending_notifications = {}
		self.notification_ttl = timedelta(minutes=1)
		self.next_notification_id = 1  # Pour générer des ID uniques
		
		# Démarrer le nettoyage périodique des notifications
		self._start_cleanup_scheduler()
	
	def _start_cleanup_scheduler(self):
		"""Démarre le planificateur de nettoyage des notifications expirées."""
		def cleanup_task():
			while True:
				time.sleep(60)  # Nettoyage toutes les minutes
				try:
					self.cleanup_notifications()
					logger.info("Nettoyage périodique des notifications terminé")
				except Exception as e:
					logger.error(f"Erreur lors du nettoyage périodique des notifications: {e}", exc_info=True)
		
		# Démarrer le nettoyage dans un thread séparé
		cleanup_thread = threading.Thread(target=cleanup_task)
		cleanup_thread.daemon = True  # Le thread se fermera quand le programme principal se termine
		cleanup_thread.start()
	
	def add_client(self, user_id, consumer):
		"""Ajoute un client connecté."""
		self.connected_clients[user_id] = consumer
		logger.info(f"Client {user_id} connecté. Total: {len(self.connected_clients)}")
		
	def remove_client(self, user_id):
		"""Supprime un client déconnecté."""
		if user_id in self.connected_clients:
			del self.connected_clients[user_id]
			logger.info(f"Client {user_id} déconnecté. Restants: {len(self.connected_clients)}")
	
	def _generate_notification_id(self):
		"""Génère un ID unique pour une notification."""
		notification_id = self.next_notification_id
		self.next_notification_id += 1
		return notification_id
	
	def store_notification(self, user_id, notification_data):
		"""Stocke une notification pour une livraison ultérieure."""
		if user_id not in self.pending_notifications:
			self.pending_notifications[user_id] = []
			
		# Ajouter un timestamp et un ID unique à la notification
		timestamp = datetime.now()
		notification_data["timestamp"] = int(timestamp.timestamp() * 1000)
		
		self.pending_notifications[user_id].append((timestamp, notification_data))
		logger.info(f"Notification {notification_data['notification_id']} stockée pour l'utilisateur {user_id}")
		
		return notification_data
		
	def get_pending_notifications(self, user_id):
		"""Récupère les notifications en attente pour un utilisateur sans les supprimer."""
		if user_id not in self.pending_notifications:
			return []
			
		# Nettoyer les notifications expirées
		self.cleanup_notifications(user_id)
		
		# Récupérer les notifications valides
		notifications = [data for _, data in self.pending_notifications.get(user_id, [])]
		
		return notifications
		
	def delete_notification(self, notification_id):
		"""Supprime toutes les notifications avec l'ID spécifié, quel que soit l'utilisateur."""
		total_deleted = 0
		
		# Parcourir tous les utilisateurs
		for user_id in list(self.pending_notifications.keys()):
			before_count = len(self.pending_notifications[user_id])
			
			# Supprimer les notifications avec l'ID spécifié
			self.pending_notifications[user_id] = [
				(timestamp, data) for timestamp, data in self.pending_notifications[user_id]
				if data.get("notification_id") != notification_id
			]
			
			after_count = len(self.pending_notifications[user_id])
			deleted_count = before_count - after_count
			total_deleted += deleted_count
			
			# Si toutes les notifications ont été supprimées pour cet utilisateur, supprimer l'entrée
			if len(self.pending_notifications[user_id]) == 0:
				del self.pending_notifications[user_id]
			
			if deleted_count > 0:
				logger.info(f"Notification {notification_id} supprimée pour l'utilisateur {user_id}")
		
		return total_deleted > 0
		
	def cleanup_notifications(self, user_id=None):
		"""Nettoie les notifications expirées."""
		current_time = datetime.now()
		
		if user_id is not None:
			# Nettoyer seulement pour un utilisateur spécifique
			if user_id in self.pending_notifications:
				before_count = len(self.pending_notifications[user_id])
				self.pending_notifications[user_id] = [
					(timestamp, data) for timestamp, data in self.pending_notifications[user_id]
					if current_time - timestamp < self.notification_ttl
				]
				after_count = len(self.pending_notifications[user_id])
				
				if after_count < before_count:
					logger.info(f"{before_count - after_count} notifications expirées supprimées pour l'utilisateur {user_id}")
				
				if not self.pending_notifications[user_id]:
					del self.pending_notifications[user_id]
		else:
			# Nettoyer pour tous les utilisateurs
			for user_id in list(self.pending_notifications.keys()):
				self.cleanup_notifications(user_id)
	
	def send_notification(self, user_id, notification_data):
		"""Envoie une notification ET la stocke systématiquement."""
		notification_data["notification_id"] = self._generate_notification_id()
		notification_data = self.store_notification(user_id, notification_data)
		
		# Si l'utilisateur est connecté, envoyer la notification immédiatement
		if user_id in self.connected_clients:
			self.connected_clients[user_id].send(text_data=json.dumps(notification_data))
			logger.info(f"Notification {notification_data['notification_id']} envoyée à l'utilisateur {user_id}")
			return True
		else:
			logger.info(f"Utilisateur {user_id} non connecté, notification {notification_data['notification_id']} en attente")
			return False


# Instance globale du gestionnaire de notifications
notification_manager = NotificationManager()


@receiver(match_started)
def handle_match_started(sender, **kwargs):
	"""Gestionnaire du signal match_started."""
	player1_id = kwargs['player1_id']
	player2_id = kwargs['player2_id']
	match = kwargs['match']
	type = kwargs['type']
	Consumer.start_match(player1_id, player2_id, match, type)

@receiver(friend_request_created)
def handle_friend_request_created(sender, **kwargs):
	"""Gestionnaire du signal friend_request_created."""
	from_user = kwargs['from_user']
	to_user = kwargs['to_user']
	
	# Préparer les données de notification
	notification_data = {
		'message': "friend_request",
		'type': "friend_request",
		'from_user_id': from_user.id,
		'from_user_name': from_user.username,
		'timestamp': int(datetime.now().timestamp() * 1000)
	}
	
	# Envoyer la notification à l'utilisateur destinataire
	notification_manager.send_notification(to_user.id, notification_data)


class Consumer(WebsocketConsumer):
	"""Consumer WebSocket pour gérer les notifications en temps réel."""

	def connect(self):
		"""Gère la connexion d'un client."""
		self.accept()
		self.user_id = int(self.scope['url_route']['kwargs']['user_id'])
		
		# Enregistrer le client
		notification_manager.add_client(self.user_id, self)
		
		# Envoyer les notifications en attente
		pending_notifications = notification_manager.get_pending_notifications(self.user_id)
		for notification in pending_notifications:
			self.send(text_data=json.dumps(notification))

	def disconnect(self, close_code):
		"""Gère la déconnexion d'un client."""
		notification_manager.remove_client(self.user_id)

	def receive(self, text_data):
		"""Gère la réception de messages du client."""
		try:
			data = json.loads(text_data)
			message_type = data.get('message')
			
			# Traiter la demande de suppression de notification
			if message_type == "delete_notification":
				notification_id = data.get('notification_id')
				if notification_id:
					deleted = notification_manager.delete_notification(notification_id)
					# Confirmer la suppression au client
					self.send(text_data=json.dumps({
						'message': 'notification_deleted',
						'notification_id': notification_id,
						'success': deleted
					}))
					return
			
			# Pour les autres types de messages (match_accept, match_decline, etc.)
			# Validation des données requises
			required_fields = ['client_id', 'match_id', 'game_type', 'id']
			if not all(field in data for field in required_fields):
				logger.warning(f"Message reçu avec des champs manquants: {data}")
				return
				
			client_id = int(data['client_id'])
			
			if message_type == "match_accept":
				self._handle_match_accept(data['match_id'], client_id)
			elif message_type == "match_decline":
				self._handle_match_decline(data['match_id'], client_id)
				
		except json.JSONDecodeError as e:
			logger.error(f"Erreur de décodage JSON: {e}")
		except KeyError as e:
			logger.error(f"Champ manquant dans les données: {e}")
		except Exception as e:
			logger.error(f"Erreur dans la méthode receive: {e}", exc_info=True)
	
	def _handle_match_accept(self, match_id, client_id):
		"""Gère l'acceptation d'un match."""
		try:
			match = Match.objects.get(id=match_id)
			tournament_match = TournamentMatch.objects.filter(match_id=match_id).first()
			
			notification_data = {
				'message': "match_start",
				'match_id': match.id,
				'game_type': match.game_type
			}
			
			if tournament_match is None:
				# Match normal
				player1_id = match.player1.id
				player2_id = match.player2.id
				
				notification_manager.send_notification(player1_id, notification_data)
				notification_manager.send_notification(player2_id, notification_data)
			else:
				# Match de tournoi
				notification_manager.send_notification(client_id, notification_data)
				
		except Match.DoesNotExist:
			logger.error(f"Match {match_id} introuvable")
		except Exception as e:
			logger.error(f"Erreur lors du traitement de match_accept: {e}", exc_info=True)
	
	def _handle_match_decline(self, match_id, client_id):

		try:
			match = Match.objects.filter(id=match_id).first()
			notification_data = {
				'message': "match_decline",
				'match_id': match_id,
			}
			tournament_match = TournamentMatch.objects.filter(match_id=match_id).first()
			if tournament_match:
				opponent = match.player2 if client_id == match.player1.id else match.player1
				match.end(opponent)
				notification_manager.send_notification(opponent.id, notification_data)			
			else:
				match.delete()
				notification_manager.send_notification(match.player1.id, notification_data)
		except Exception as e:
			logger.error(f"Erreur lors du traitement de match_decline: {e}", exc_info=True)

	@staticmethod
	def start_match(player1, player2, match, type):
		"""Démarre un match entre deux joueurs."""
		try:
			match_id = match.id
			tournament_match = TournamentMatch.objects.filter(match_id=match_id).first()
			
			# Obtenir les noms d'utilisateur
			if isinstance(player1, int):
				player1_id = player1
				player1_name = User.objects.get(id=player1).username
			else:
				player1_id = player1.id
				player1_name = player1.username
				
			if isinstance(player2, int):
				player2_id = player2
				player2_name = User.objects.get(id=player2).username
			else:
				player2_id = player2.id
				player2_name = player2.username
			
			# Préparer les données de notification
			notification_data = {
				'message': "match_request",
				'match_id': match_id,
				'game_type': match.game_type,
				'tournament': bool(tournament_match),
				'player1_id': player1_id,
				'player2_id': player2_id,
				'player1_name': player1_name,
				'player2_name': player2_name,
				'type' : type,
			}
			
			# Ajouter des informations de tournoi si nécessaire
			if tournament_match and hasattr(tournament_match, 'round') and tournament_match.round:
				tournament = tournament_match.round.tournament
				if tournament:
					notification_data["tournament_id"] = tournament.id
					notification_data["tournament_name"] = getattr(tournament, 'name', "Tournoi")
			# Envoyer les notifications aux joueurs
			notification_manager.send_notification(player1_id, notification_data)
			notification_manager.send_notification(player2_id, notification_data)
			
			# Configurer un timer pour vérifier le statut du match après 60 secondes
			def check_match_status():
				time.sleep(70)
				try:
					# Récupérer le match à nouveau pour avoir son statut actuel
					current_match = Match.objects.get(id=match_id)
					
					# Vérifier si le match est toujours en attente
					if current_match.status == 'pending':
						logger.info(f"Match {match_id} toujours en attente après 60 secondes, attribution aléatoire du gagnant")
						
						# Choisir un gagnant aléatoirement
						winner = random.choice([current_match.player1, current_match.player2])
						
						# Terminer le match avec le gagnant aléatoire
						current_match.end(winner)
				except Match.DoesNotExist:
					logger.info(f"Match {match_id} n'existe plus, probablement déjà traité ou supprimé")
				except Exception as e:
					logger.error(f"Erreur lors de la vérification du statut du match après timeout: {e}", exc_info=True)
			# Lancer le timer dans un thread séparé
			timer_thread = threading.Thread(target=check_match_status)
			timer_thread.daemon = True  # Le thread se fermera quand le programme principal se termine
			timer_thread.start()
			
		except Exception as e:
			logger.error(f"Erreur lors du démarrage du match: {e}", exc_info=True)