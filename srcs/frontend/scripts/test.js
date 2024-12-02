var socket;
function onLoad() {

	var id = 42;
	if (window.user === undefined) {
		console.log('User not authenticated');
	} else {
		id = window.user.id;
	}
	console.log("User ID: [" + id + "]");

	socket = new WebSocket('ws://localhost:8042/ws/notification/' + id);

	// Écoutez l'événement 'open' qui est déclenché lorsque la connexion est établie.
	socket.addEventListener('open', function (event) {
		console.log('WebSocket is open now.');
	});

	// Écoutez l'événement 'message' qui est déclenché lorsque des données sont reçues du serveur.
	socket.addEventListener('message', function (event) {
		console.log('Message from server: ', event.data);
		alert(event.data);
	});

	socket.onerror = function (error) {
		alert(`[error] ${error.message}`);
	};
}
function sendNotification() {
	var message = {
		message: "Test Message from " + window.user.username,
	};
	socket.send(JSON.stringify(message));
}

function onUnload() {
	socket.close();
}

export { onLoad,onUnload, sendNotification };
window.sendNotification = sendNotification;
window.onUnload = onUnload;