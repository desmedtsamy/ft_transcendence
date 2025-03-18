from datetime import datetime, timedelta
import json
import logging

from django.dispatch import receiver
from channels.generic.websocket import WebsocketConsumer

from account.models import User
from game.services import create_match
from game.models import Match, TournamentMatch
from game.signals import match_started

# Configuration du logger
logger = logging.getLogger(__name__)

class NotificationManager:
    """Gestionnaire de notifications pour les clients websocket."""
    
    def __init__(self):
        self.connected_clients = {}
        self.pending_notifications = {}
        self.notification_ttl = timedelta(minutes=1)
    
    def add_client(self, user_id, consumer):
        """Ajoute un client connecté."""
        self.connected_clients[user_id] = consumer
        logger.info(f"Client {user_id} connecté. Total: {len(self.connected_clients)}")
        
    def remove_client(self, user_id):
        """Supprime un client déconnecté."""
        if user_id in self.connected_clients:
            del self.connected_clients[user_id]
            logger.info(f"Client {user_id} déconnecté. Restants: {len(self.connected_clients)}")
    
    def store_notification(self, user_id, notification_data):
        """Stocke une notification pour une livraison ultérieure."""
        if user_id not in self.pending_notifications:
            self.pending_notifications[user_id] = []
            
        # Ajouter un timestamp à la notification
        timestamp = datetime.now()
        notification_data["timestamp"] = int(timestamp.timestamp() * 1000)
        
        self.pending_notifications[user_id].append((timestamp, notification_data))
        logger.info(f"Notification stockée pour l'utilisateur {user_id}")
        
    def get_pending_notifications(self, user_id):
        """Récupère et nettoie les notifications en attente pour un utilisateur."""
        if user_id not in self.pending_notifications:
            return []
            
        # Nettoyer les notifications expirées
        self.cleanup_notifications(user_id)
        
        # Récupérer les notifications valides
        notifications = [data for _, data in self.pending_notifications.get(user_id, [])]
        
        # Supprimer les notifications après récupération
        if user_id in self.pending_notifications:
            del self.pending_notifications[user_id]
            
        return notifications
        
    def cleanup_notifications(self, user_id=None):
        """Nettoie les notifications expirées."""
        current_time = datetime.now()
        
        if user_id is not None:
            # Nettoyer seulement pour un utilisateur spécifique
            if user_id in self.pending_notifications:
                self.pending_notifications[user_id] = [
                    (timestamp, data) for timestamp, data in self.pending_notifications[user_id]
                    if current_time - timestamp < self.notification_ttl
                ]
                if not self.pending_notifications[user_id]:
                    del self.pending_notifications[user_id]
        else:
            # Nettoyer pour tous les utilisateurs
            for user_id in list(self.pending_notifications.keys()):
                self.cleanup_notifications(user_id)
    
    def send_notification(self, user_id, notification_data):
        """Envoie une notification ou la stocke si le client n'est pas connecté."""
        if user_id in self.connected_clients:
            print("send message ", notification_data)
            self.connected_clients[user_id].send(text_data=json.dumps(notification_data))
            logger.info(f"Notification envoyée à l'utilisateur {user_id}")
            return True
        else:
            self.store_notification(user_id, notification_data)
            logger.info(f"Utilisateur {user_id} non connecté, notification stockée")
            return False


# Instance globale du gestionnaire de notifications
notification_manager = NotificationManager()


@receiver(match_started)
def handle_match_started(sender, **kwargs):
    """Gestionnaire du signal match_started."""
    player1_id = kwargs['player1_id']
    player2_id = kwargs['player2_id']
    match = kwargs['match']
    Consumer.start_match(player1_id, player2_id, match)


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
            
            # Validation des données requises
            required_fields = ['client_id', 'match_id', 'game_type', 'message', 'name', 'id']
            if not all(field in data for field in required_fields):
                logger.warning(f"Message reçu avec des champs manquants: {data}")
                return
                
            client_id = int(data['client_id'])
            message_type = data['message']
            
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
        """Gère le refus d'un match."""
        try:
            tournament_match = TournamentMatch.objects.filter(match_id=match_id).first()
            
            if tournament_match:
                # Match de tournoi
                logger.info(f"Refus d'un match de tournoi {match_id}")
                match = tournament_match.match
                opponent = match.player2 if client_id == match.player1.id else match.player1
                match.end(opponent)
            else:
                # Match normal
                logger.info(f"Refus d'un match normal {match_id}")
                match = Match.objects.filter(id=match_id).first()
                notification_data = {
                	'message': "match_decline"
            	}
                notification_manager.send_notification(match.player1.id,notification_data)
                if match:
                    match.delete()
                    
        except Exception as e:
            logger.error(f"Erreur lors du traitement de match_decline: {e}", exc_info=True)

    @staticmethod
    def start_match(player1, player2, match):
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
                'player2_name': player2_name
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
            
        except Exception as e:
            logger.error(f"Erreur lors du démarrage du match: {e}", exc_info=True)