/**
 * Module de gestion des notifications pour le système de matchmaking
 */
class NotificationManager {
	/**
	 * Initialise le gestionnaire de notifications
	 */
	constructor() {
	  this.socket = null;
	  this.reconnectDelay = 2000;
	  this.reconnectTimer = null;
	  this.timeoutHandlers = {};
	  this.game_type = localStorage.getItem('selectedGame');
	  this.NOTIFICATION_TIMEOUT = 60000; // 60 secondes en ms
	}
  
	/**
	 * Initialise la connexion WebSocket pour les notifications
	 * @returns {Promise} Promesse résolue lorsque la connexion est établie
	 */
	initialize() {
	  if (!window.user) {
		console.warn('Tentative d\'initialisation des notifications sans utilisateur connecté');
		return Promise.reject('Utilisateur non connecté');
	  }
  
	  return new Promise((resolve, reject) => {
		const userId = window.user.id;
		this.socket = new WebSocket(`wss://${window.location.host}/wss/notification/${userId}`);
		
		// Gestionnaire d'ouverture de connexion
		this.socket.addEventListener('open', () => {
		  resolve(this.socket);
		});
  
		// Gestionnaire de fermeture de connexion
		this.socket.addEventListener('close', () => {
		  this._scheduleReconnect();
		});
  
		// Gestionnaire d'erreur
		this.socket.addEventListener('error', (error) => {
		  console.error('Erreur WebSocket:', error);
		  reject(error);
		});
  
		// Gestionnaire de messages
		this.socket.addEventListener('message', (event) => {
		  this._handleIncomingMessage(event);
		});
	  });
	}
  
	/**
	 * Planifie une tentative de reconnexion
	 * @private
	 */
	_scheduleReconnect() {
	  if (this.reconnectTimer) {
		clearTimeout(this.reconnectTimer);
	  }
  
	  if (window.user) {
		this.reconnectTimer = setTimeout(() => {
		  this.initialize().catch(err => {
			console.warn('Échec de reconnexion:', err);
		  });
		}, this.reconnectDelay);
	  }
	}
  
	/**
	 * Traite les messages entrants
	 * @param {MessageEvent} event - Événement de message WebSocket
	 * @private
	 */
	_handleIncomingMessage(event) {
	  try {
		const data = JSON.parse(event.data);
		
		// Si le message est une confirmation de suppression
		if (data.message === 'notification_deleted')
			return;
		
		switch (data.message) {
		  case 'match_request':
			if (data.type == "matchmaking")
				this._handleMatchStart(data);
			else
				this._handleMatchRequest(data);
			break;
		  case 'match_start':
			this._handleMatchStart(data);
			break;
		  case 'match_decline':
			this._handleMatchDecline(data);
			break;
		  case 'friend_request':
			this._handleFriendRequest(data);
		  default:
			break;
		}
	  } catch (error) {
		console.error('Erreur de traitement du message:', error);
	  }
	}
  
	/**
	 * Traite une demande de match
	 * @param {Object} data - Données de la demande de match
	 * @private
	 */
	_handleMatchRequest(data) {
	  const userId = window.user.id;
	  const match_id = data.match_id;
	  const timestamp = data.timestamp;
	  const notification_id = data.notification_id;
	  const isTournament = data.tournament === true;
	  const tournamentName = data.tournament_name || "Tournoi";
	  const player1Name = data.player1_name || "Joueur 1";
	  const player2Name = data.player2_name || "Joueur 2";
	  const player1Id = data.player1_id;
	  const player2Id = data.player2_id;
	  const isPlayer1 = userId === player1Id;
	  const opponentName = isPlayer1 ? player2Name : player1Name;
	  
	  // Créer l'alerte de match
	  const alertEl = this._createMatchAlert({
		match_id,
		notification_id,
		isTournament,
		tournamentName,
		opponentName,
		isPlayer1,
		timestamp
	  });
	  
	  // Ajouter l'alerte au conteneur
	  const alertsEl = document.getElementById('alerts');
	  alertsEl.appendChild(alertEl);
	  
	  // Configurer le timeout automatique
	  this.timeoutHandlers[match_id] = setTimeout(() => {
		if (alertsEl.contains(alertEl)) {
		  this.declineMatch(userId, match_id, isTournament);
		  // Supprimer la notification côté serveur
		  if (notification_id) {
			this._deleteNotification(notification_id);
		  }
		  alertEl.remove();
		}
	  }, this.NOTIFICATION_TIMEOUT);
	}
  
	/**
	 * Traite une demande d'ami
	 * @param {Object} data - Données de la demande d'ami
	 * @private
	 */
	_handleFriendRequest(data) {
	  const from_user_id = data.from_user_id;
	  const from_user_name = data.from_user_name;
	  const timestamp = data.timestamp;
	  const notification_id = data.notification_id;
	  
	  // Créer l'alerte de demande d'ami
	  const alertEl = this._createFriendRequestAlert({
		from_user_id,
		from_user_name,
		timestamp,
		notification_id
	  });
	  // Ajouter l'alerte au conteneur
	  const alertsEl = document.getElementById('alerts');
	  alertsEl.appendChild(alertEl);
	  
	  // Configurer le timeout pour supprimer automatiquement après 5 minutes
	  setTimeout(() => {
		if (alertsEl.contains(alertEl)) {
		  // Supprimer la notification côté serveur
		  alertEl.remove();
		}
	  }, 5 * 60 * 1000); // 5 minutes
	}

	/**
	 * Crée l'élément d'alerte pour une demande de match
	 * @param {Object} options - Options de l'alerte
	 * @returns {HTMLElement} - Élément d'alerte
	 * @private
	 */
	_createMatchAlert({ match_id, notification_id, isTournament, tournamentName, opponentName, isPlayer1, timestamp }) {
	  const userId = window.user.id;
	  
	  // Créer l'élément d'alerte
	  const alertEl = document.createElement('div');
	  alertEl.className = 'alert alert-normal';
	  alertEl.style.display = 'flex';
	  alertEl.style.justifyContent = 'space-between';
	  alertEl.style.flexDirection = 'column';
	  alertEl.id = match_id;
	  
	  // Définir le message de l'alerte
	  if (isTournament) {
		alertEl.textContent = `Un match du tournoi "${tournamentName}" va commencer contre ${opponentName}`;
	  } else if (isPlayer1) {
		alertEl.textContent = `Demande envoyée`;
	  } else {
		alertEl.textContent = `${opponentName} vous propose un match`;
	  }
	  
	  // Créer le conteneur des boutons
	  const buttonsContainer = document.createElement('div');
	  buttonsContainer.style.display = 'flex';
	  buttonsContainer.style.justifyContent = 'space-between';
	  buttonsContainer.style.marginTop = '10px';
	  
	  // Ajouter les boutons d'action si nécessaire
	  if (isTournament || !isPlayer1) {
		// Bouton d'acceptation
		const acceptButton = this._createButton('Accept', 'button btn-success accept-friend-request', () => {
		  this.acceptMatch(userId, match_id);
		  this._clearMatchTimeout(match_id);
		  alertEl.remove()
		  if (notification_id) {
		    this._deleteNotification(notification_id);
		  }
		});
		
		// Bouton de refus
		const declineButton = this._createButton('Decline', 'button btn-danger cancel-friend-request', () => {
		  this.declineMatch(userId, match_id, isTournament);
		  this._clearMatchTimeout(match_id);
		  if (notification_id) {
		    this._deleteNotification(notification_id);
		  }
		  alertEl.remove();
		});
		
		buttonsContainer.appendChild(acceptButton);
		buttonsContainer.appendChild(declineButton);
	  }
	  
	  // Créer les éléments du timer
	  const { timerContainer, timerInterval } = this._createMatchTimer(timestamp);
	  
	  // Ajouter les éléments à l'alerte
	  alertEl.appendChild(buttonsContainer);
	  alertEl.appendChild(timerContainer);
	  
	  // Stocker la référence au timer pour le nettoyage
	  alertEl.dataset.timerId = timerInterval;
	  // Stocker l'ID de notification pour référence
	  if (notification_id) {
	    alertEl.dataset.notificationId = notification_id;
	  }
	  
	  return alertEl;
	}
  
	/**
	 * Crée un bouton avec gestionnaire d'événement
	 * @param {string} text - Texte du bouton
	 * @param {string} classes - Classes CSS
	 * @param {Function} clickHandler - Gestionnaire de clic
	 * @returns {HTMLButtonElement} - Élément bouton
	 * @private
	 */
	_createButton(text, classes, clickHandler) {
	  const button = document.createElement('button');
	  button.className = classes;
	  button.textContent = text;
	  button.addEventListener('click', clickHandler);
	  return button;
	}
  
	/**
	 * Crée un timer visuel pour la demande de match
	 * @param {number} timestamp - Horodatage de la demande
	 * @returns {Object} - Conteneur du timer et ID de l'intervalle
	 * @private
	 */
	_createMatchTimer(timestamp) {
	  // Créer le conteneur pour le timer
	  const timerContainer = document.createElement('div');
	  timerContainer.style.marginTop = '10px';
	  timerContainer.style.textAlign = 'center';
	  
	  // Créer l'élément pour le texte du timer
	  const timerText = document.createElement('div');
	  timerText.style.fontWeight = 'bold';
	  timerText.style.marginBottom = '5px';
	  
	  // Créer la barre de progression
	  const progressBar = document.createElement('div');
	  progressBar.style.width = '100%';
	  progressBar.style.backgroundColor = '#eee';
	  progressBar.style.borderRadius = '5px';
	  progressBar.style.overflow = 'hidden';
	  
	  const progressFill = document.createElement('div');
	  progressFill.style.height = '10px';
	  progressFill.style.width = '100%';
	  progressFill.style.backgroundColor = '#4CAF50';
	  progressFill.style.transition = 'width 1s linear';
	  
	  progressBar.appendChild(progressFill);
	  timerContainer.appendChild(timerText);
	  timerContainer.appendChild(progressBar);
	  
	  // Calcul du temps restant
	  let timeLeft = 60;
	  if (timestamp) {
		const elapsedTime = Math.floor((Date.now() - timestamp) / 1000);
		timeLeft = Math.max(0, 60 - elapsedTime);
	  }
	  timerText.textContent = `${timeLeft} secondes restantes`;
	  
	  // Mise à jour du timer
	  const timerInterval = setInterval(() => {
		timeLeft--;
		
		if (timeLeft <= 0) {
		  clearInterval(timerInterval);
		  timerText.textContent = "Temps écoulé";
		  return;
		}
		
		// Mettre à jour le texte et la barre de progression
		timerText.textContent = `${timeLeft} secondes restantes`;
		const percentLeft = (timeLeft / 60) * 100;
		progressFill.style.width = `${percentLeft}%`;
		
		// Changer la couleur en fonction du temps restant
		if (timeLeft <= 10) {
		  progressFill.style.backgroundColor = '#f44336'; // Rouge
		} else if (timeLeft <= 30) {
		  progressFill.style.backgroundColor = '#ff9800'; // Orange
		}
	  }, 1000);
	  
	  return { timerContainer, timerInterval };
	}
  
	/**
	 * Nettoie le timeout d'un match
	 * @param {number} matchId - ID du match
	 * @private
	 */
	_clearMatchTimeout(matchId) {
	  if (this.timeoutHandlers[matchId]) {
		clearTimeout(this.timeoutHandlers[matchId]);
		delete this.timeoutHandlers[matchId];
	  }
	  
	  // Nettoyer aussi les intervalles des timers visuels
	  const alerts = document.getElementById('alerts').querySelectorAll('.alert');
	  alerts.forEach(alert => {
		const timerId = alert.dataset.timerId;
		if (timerId) {
		  clearInterval(parseInt(timerId, 10));
		}
	  });
	}
  
	/**
	 * Traite le démarrage d'un match
	 * @param {Object} data - Données du match
	 * @private
	 */
	_handleMatchStart(data) {
		const alertEl = document.getElementById(data.match_id);
		if (alertEl)
			alertEl.remove()
		if (data.notification_id) {
			this._deleteNotification(data.notification_id);
		}
	  
		if (data.game_type !== this.game_type && window.setSelectedGame) {
			window.setSelectedGame(data.game_type);
		}
		
		if (data.game_type === "pong") {
			window.navigateTo(`/pong/${data.match_id}`);
		} else {
			window.navigateTo(`/tictactoe/${data.match_id}`);
		}
	}

	_handleMatchDecline(data) {
		const alertsEl = document.getElementById('alerts');
		const alertEl = document.getElementById(data.match_id);
		if (alertEl){
			if (alertEl.dataset.notificationId) {
				this._deleteNotification(alertEl.dataset.notificationId);
			}
			alertEl.remove()
		}
		if (data.notification_id) {
			this._deleteNotification(data.notification_id);
		}

		const declineAlert = document.createElement('div');
		declineAlert.className = 'alert alert-danger';
		declineAlert.textContent = `${data.player2_name || 'Votre adversaire'} a refusé votre invitation.`;
		
		// Ajouter la notification
		alertsEl.appendChild(declineAlert);
		
		// Supprimer la notification après 5 secondes
		setTimeout(() => {
			declineAlert.remove();
		}, 5000);
	}
  
	/**
	 * Crée l'élément d'alerte pour une demande d'ami
	 * @param {Object} options - Options de l'alerte
	 * @returns {HTMLElement} - Élément d'alerte
	 * @private
	 */
	_createFriendRequestAlert({ from_user_id, from_user_name, timestamp, notification_id }) {
	  // Créer l'élément d'alerte
	  const alertEl = document.createElement('div');
	  alertEl.className = 'alert alert-info friend-request-alert';
	  alertEl.style.display = 'flex';
	  alertEl.style.justifyContent = 'space-between';
	  alertEl.style.flexDirection = 'column';
	  alertEl.id = `friend-request-${from_user_id}-${timestamp}`;
	  
	  // Stockage de l'ID de notification
	  if (notification_id) {
	    alertEl.dataset.notificationId = notification_id;
	  }
	  
	  // Définir le message de l'alerte
	  const messageEl = document.createElement('div');
	  messageEl.textContent = `${from_user_name} vous a envoyé une demande d'ami`;
	  alertEl.appendChild(messageEl);
	  
	  // Créer le conteneur des boutons
	  const buttonsContainer = document.createElement('div');
	  buttonsContainer.style.display = 'flex';
	  buttonsContainer.style.justifyContent = 'space-between';
	  buttonsContainer.style.marginTop = '10px';
	  
	  // Bouton d'acceptation
	  const acceptButton = this._createButton('Accepter', 'button btn-success accept-friend-request', () => {
		this._acceptFriendRequest(from_user_id);
		// Supprimer la notification côté serveur
		if (notification_id) {
		  this._deleteNotification(notification_id);
		}
		alertEl.remove();
	  });
	  
	  // Bouton de refus
	  const declineButton = this._createButton('Refuser', 'button btn-danger cancel-friend-request', () => {
		this._rejectFriendRequest(from_user_id);
		// Supprimer la notification côté serveur
		if (notification_id) {
		  this._deleteNotification(notification_id);
		}
		alertEl.remove();
	  });
	  
	  buttonsContainer.appendChild(acceptButton);
	  buttonsContainer.appendChild(declineButton);
	  alertEl.appendChild(buttonsContainer);
	  
	  return alertEl;
	}
  
	/**
	 * Accepte une demande d'ami
	 * @param {number} userId - ID de l'utilisateur qui a envoyé la demande
	 * @private
	 */
	_acceptFriendRequest(userId) {
	  fetch(`/api/account/friend-requests/${userId}/accept/`, {
		method: 'POST',
		headers: {
		  'X-CSRFToken': this._getCookie('csrftoken'),
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({
		  user_id: userId,
		}),
	  }).then(response => {
		if (response.ok) {
		  // Afficher une notification de succès
		  this._showSuccessAlert(`Demande d'ami acceptée!`);
		  
		  // Si nous sommes sur la page des amis, recharger la liste
		  if (typeof onLoad === 'function') {
			onLoad();
		  }
		} else {
		  console.error('Erreur lors de l\'acceptation de la demande d\'ami');
		}
	  }).catch(error => {
		console.error('Erreur réseau:', error);
	  });
	}
  
	/**
	 * Refuse une demande d'ami
	 * @param {number} userId - ID de l'utilisateur qui a envoyé la demande
	 * @private
	 */
	_rejectFriendRequest(userId) {
	  fetch(`/api/account/friend-requests/${userId}/reject/`, {
		method: 'POST',
		headers: {
		  'X-CSRFToken': this._getCookie('csrftoken'),
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({
		  user_id: userId,
		}),
	  }).then(response => {
		if (response.ok) {
		  // Afficher une notification de succès
		  this._showSuccessAlert(`Demande d'ami refusée`);
		  
		  // Si nous sommes sur la page des amis, recharger la liste
		  if (typeof onLoad === 'function') {
			onLoad();
		  }
		} else {
		  console.error('Erreur lors du refus de la demande d\'ami');
		}
	  }).catch(error => {
		console.error('Erreur réseau:', error);
	  });
	}
  
	/**
	 * Affiche une alerte de succès temporaire
	 * @param {string} message - Message à afficher
	 * @private
	 */
	_showSuccessAlert(message) {
	  const alertsEl = document.getElementById('alerts');
	  const successAlert = document.createElement('div');
	  successAlert.className = 'alert alert-success';
	  successAlert.textContent = message;
	  
	  alertsEl.appendChild(successAlert);
	  
	  // Disparaît après 3 secondes
	  setTimeout(() => {
		successAlert.remove();
	  }, 3000);
	}
  
	/**
	 * Récupère un cookie par son nom
	 * @param {string} name - Nom du cookie
	 * @returns {string} - Valeur du cookie
	 * @private
	 */
	_getCookie(name) {
	  const value = `; ${document.cookie}`;
	  const parts = value.split(`; ${name}=`);
	  if (parts.length === 2) return parts.pop().split(';').shift();
	  return '';
	}
  
	/**
	 * Envoie une notification au serveur
	 * @param {number} client_id - ID du client destinataire
	 * @param {number} match_id - ID du match
	 * @param {string} message - Type de message
	 * @returns {boolean} - Vrai si l'envoi a réussi
	 */
	sendNotification(client_id, match_id, message) {
	  if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
		console.error('WebSocket non disponible pour l\'envoi de notification');
		return false;
	  }
	  
	  const payload = {
		client_id,
		match_id,
		message,
		name: window.user.username,
		id: window.user.id,
		game_type: this.game_type
	  };
	  
	  try {
		this.socket.send(JSON.stringify(payload));
		return true;
	  } catch (error) {
		console.error('Erreur lors de l\'envoi de la notification:', error);
		return false;
	  }
	}
  
	/**
	 * Accepte un match
	 * @param {number} userId - ID de l'utilisateur
	 * @param {number} matchId - ID du match
	 */
	acceptMatch(userId, matchId) {
	  this.sendNotification(userId, matchId, 'match_accept');
	}
  
	/**
	 * Refuse un match
	 * @param {number} userId - ID de l'utilisateur
	 * @param {number} matchId - ID du match
	 * @param {boolean} isTournament - Indique si le match fait partie d'un tournoi
	 */
	declineMatch(userId, matchId, isTournament) {
	  this.sendNotification(userId, matchId, 'match_decline');
	}
  
	/**
	 * Ferme proprement la connexion WebSocket
	 */
	disconnect() {
	  if (this.reconnectTimer) {
		clearTimeout(this.reconnectTimer);
		this.reconnectTimer = null;
	  }
	  
	  if (this.socket) {
		this.socket.close();
		this.socket = null;
	  }
	  
	  // Nettoyer tous les timeouts en cours
	  Object.keys(this.timeoutHandlers).forEach(matchId => {
		clearTimeout(this.timeoutHandlers[matchId]);
	  });
	  this.timeoutHandlers = {};
	}
  
	/**
	 * Supprime une notification sur le serveur
	 * @param {number} notificationId - ID de la notification à supprimer
	 * @private
	 */
	_deleteNotification(notificationId) {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
			console.error('WebSocket non disponible pour la suppression de notification');
			return false;
		}
		
		try {
			this.socket.send(JSON.stringify({
				message: 'delete_notification',
				notification_id: notificationId
			}));
			return true;
		} catch (error) {
			console.error('Erreur lors de la suppression de notification:', error);
			return false;
		}
	}
  }
  
  // Création d'une instance du gestionnaire de notifications
  const notificationManager = new NotificationManager();
  
  /**
   * Initialise les notifications et expose les fonctions nécessaires globalement
   */
  function initializeNotifications() {
	// Fonction d'initialisation des notifications
	window.setNotification = function() {
	  notificationManager.initialize().catch(error => {
		console.error('Échec d\'initialisation des notifications:', error);
	  });
	};
	
	// Fonction d'envoi de notification
	window.sendNotification = function(client_id, match_id, message) {
	  const success = notificationManager.sendNotification(client_id, match_id, message);
	};
	
	// Fonction d'acceptation de match
	window.acceptMatch = function(userId, matchId) {
	  notificationManager.acceptMatch(userId, matchId);
	};
	
	// Fonction de refus de match
	window.declineMatch = function(userId, matchId) {
		notificationManager.declineMatch(userId, matchId);
    };
    
    // Fonction de déconnexion accessible depuis l'extérieur
    window.disconnectNotifications = function() {
      if (notificationManager && typeof notificationManager.disconnect === 'function') {
        notificationManager.disconnect();
      }
    };
	  
    // Fonction de nettoyage lors de la fermeture de la page
    window.onUnload = function() {
      window.disconnectNotifications();
    };
  }
  
	// Exécuter l'initialisation des notifications
	initializeNotifications();
	
	// Si la page est déjà chargée, démarrer les notifications
	if (document.readyState === 'complete' || document.readyState === 'interactive') {
	  setTimeout(() => {
		if (window.user) {
		  window.setNotification();
		}
	  }, 100);
	} else {
	  // Sinon, attendre que la page soit chargée
	  document.addEventListener('DOMContentLoaded', () => {
		if (window.user) {
		  window.setNotification();
		}
	  });
	}
	