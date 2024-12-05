var socket;
function setNotification() {

	var id = 0;
	if (window.user === undefined) {
		console.log('User not authenticated');
		return;
	} else {
		id = window.user.id;
	}
	console.log("User ID: [" + id + "]");

	socket = new WebSocket('ws://localhost:8042/ws/notification/' + id);

	// Écoutez l'événement 'open' qui est déclenché lorsque la connexion est établie.
	socket.addEventListener('open', function (event) {
		console.log('WebSocket is open now.');
	});
	socket.addEventListener('close', function (event) {
		console.log('WebSocket is close.');
	});

	// Écoutez l'événement 'message' qui est déclenché lorsque des données sont reçues du serveur.
	socket.addEventListener('message', function (event) {
		const data = JSON.parse(event.data);
		console.log('Message from server: ', data);
		if (data.message == "match_request")
			matchRequest(data.name, data.id);
		if (data.message == "match_start")
			window.location.href = '/pong/' + data.match_id;
		else
	alert(data.message);
});

socket.onerror = function (error) {
	alert(`[error] ${error.message}`);
};
}

function matchRequest(name, id) {
	const alertsEl = document.getElementById('alerts');
	const alertEl = document.createElement('div');
	alertEl.className = `alert alert-normal`;
	alertEl.textContent = "Vous avez une demande de match de " + name;
	alertEl.style.display = 'flex';
	alertEl.style.justifyContent = 'space-between';
	
	const buttonsContainer = document.createElement('div');
	buttonsContainer.style.display = 'flex';
	
	const acceptButton = document.createElement('button');
	acceptButton.classList.add('button', 'btn-success', 'accept-friend-request');
	acceptButton.textContent = 'Accept';
	acceptButton.addEventListener('click', function() {
		acceptMatch(id);
		alertsEl.innerHTML = '';
	});
	buttonsContainer.appendChild(acceptButton);
	
	const declineButton = document.createElement('button');
	declineButton.classList.add('button', 'btn-danger', 'cancel-friend-request');
	declineButton.textContent = 'Decline';
	declineButton.addEventListener('click', function() {
		declineMatch(id);
		alertsEl.innerHTML = '';
	});
	buttonsContainer.appendChild(declineButton);
	
	alertEl.appendChild(buttonsContainer);
	
	alertsEl.appendChild(alertEl);
}

function acceptMatch(id) {
	window.sendNotification(id, 'match_accept');
}

function declineMatch(id) {
	window.sendNotification(id, 'match_decline');
}
function sendNotification(client_id, message) {
	alert("message envoyé");
	socket.send(JSON.stringify({
		client_id: client_id,
		message: message,
		name: window.user.username,
		id: window.user.id
	}));
}

function onUnload() {
	socket.close();
}

// export { onLoad,onUnload, sendNotification, setNotification };
window.sendNotification = sendNotification;
window.setNotification = setNotification;
window.onUnload = onUnload;