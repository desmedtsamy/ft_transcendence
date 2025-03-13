var socket;
const game_type = localStorage.getItem('selectedGame');

function setNotification() {

	var id = 0;
	if (window.user === undefined) {
		return;
	} else {
		id = window.user.id;
	}

	socket = new WebSocket('wss://' + window.location.host + '/wss/notification/' + id);
	// Écoutez l'événement 'open' qui est déclenché lorsque la connexion est établie.
	socket.addEventListener('open', function (event) {
		console.log('WebSocket is open now.');
	});
	socket.addEventListener('close', function (event) {
		console.log('WebSocket is close.');
		// wait 5 seconds before reconnecting
		setTimeout(function() {
			setNotification();
		}, 2000);
	});

	// Écoutez l'événement 'message' qui est déclenché lorsque des données sont reçues du serveur.
	socket.addEventListener('message', function (event) {
		const data = JSON.parse(event.data);
		if (data.message == "match_request")
			matchRequest(data.name, window.user.id, data.match_id);
		else if (data.message == "match_start")
			if (data.game_type == "pong")
				navigateTo( '/pong/' + data.match_id);
			else
				navigateTo( '/tictactoe/' + data.match_id);
	// alert(data.message);
});

socket.onerror = function (error) {
	alert(`[error] ${error.message}`);
};
}

function matchRequest(name, id, match_id) {
	const alertsEl = document.getElementById('alerts');
	const alertEl = document.createElement('div');
	alertEl.className = `alert alert-normal`;
	if (name == null)
		alertEl.textContent = "Un match de tournoi va commencer";
	else	
		alertEl.textContent = "Vous avez une demande de match de " + name;
	alertEl.style.display = 'flex';
	alertEl.style.justifyContent = 'space-between';
	alertEl.style.flexDirection = 'column';
	
	const buttonsContainer = document.createElement('div');
	buttonsContainer.style.display = 'flex';
	buttonsContainer.style.justifyContent = 'space-between';
	buttonsContainer.style.marginTop = '10px';
	
	const acceptButton = document.createElement('button');
	acceptButton.classList.add('button', 'btn-success', 'accept-friend-request');
	acceptButton.textContent = 'Accept';
	acceptButton.addEventListener('click', function() {
		acceptMatch(id, match_id);
		alertsEl.innerHTML = '';
		clearInterval(timerInterval);
	});
	buttonsContainer.appendChild(acceptButton);
	
	const declineButton = document.createElement('button');
	declineButton.classList.add('button', 'btn-danger', 'cancel-friend-request');
	declineButton.textContent = 'Decline';
	declineButton.addEventListener('click', function() {
		declineMatch(id, match_id);
		alertsEl.innerHTML = '';
		clearInterval(timerInterval);
	});
	buttonsContainer.appendChild(declineButton);
	
	// Créer le container pour le timer
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
	
	alertEl.appendChild(buttonsContainer);
	alertEl.appendChild(timerContainer);
	alertsEl.appendChild(alertEl);
	
	// Configurer le timer
	let timeLeft = 60;
	timerText.textContent = `${timeLeft} secondes restantes`;
	
	const timerInterval = setInterval(function() {
		timeLeft--;
		timerText.textContent = `${timeLeft} secondes restantes`;
		
		// Mettre à jour la barre de progression
		const percentLeft = (timeLeft / 60) * 100;
		progressFill.style.width = `${percentLeft}%`;
		
		// Changer la couleur en fonction du temps restant
		if (timeLeft <= 10) {
			progressFill.style.backgroundColor = '#f44336'; // Rouge quand peu de temps
		} else if (timeLeft <= 30) {
			progressFill.style.backgroundColor = '#ff9800'; // Orange quand temps modéré
		}
		
		if (timeLeft <= 0) {
			clearInterval(timerInterval);
			declineMatch(id, match_id);
			alertsEl.innerHTML = '';
		}
	}, 1000);
	
	setTimeout(function() {
		clearInterval(timerInterval);
		if (alertsEl.contains(alertEl)) {
			declineMatch(id, match_id);
			alertsEl.innerHTML = '';
		}
	}, 60000);
}

function acceptMatch(id, match_id) {
	window.sendNotification(id, match_id, 'match_accept');
}

function declineMatch(id, match_id) {
	window.sendNotification(id, match_id, 'match_decline');
}
function sendNotification(client_id, match_id,  message) {
	alert("message envoyé");
	socket.send(JSON.stringify({
		client_id: client_id,
		match_id: match_id,
		message: message,
		name: window.user.username,
		id: window.user.id,
		game_type: game_type
	}));
}

function onUnload() {
	socket.close();
}

// export { onLoad,onUnload, sendNotification, setNotification };
window.sendNotification = sendNotification;
window.setNotification = setNotification;
window.onUnload = onUnload;