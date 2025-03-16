function onLoad() {
	document.getElementById('gameSelector').disabled = true;
	let loader = document.getElementById('loader');
	if (window.selected_game === "pong")
		setPongLoader(loader);
	else
	setTicTacToeLoader(loader);

	let socket = new WebSocket('wss://' + window.location.host + '/wss/matchmaking/' + window.user.id);
	socket.addEventListener('open', function () {
		const gameType = window.selected_game || 'pong';
		socket.send(JSON.stringify({
			action: 'find_match',
			game_type: gameType
		}));
	});

	socket.addEventListener('message', function (event) {
		const data = JSON.parse(event.data);
		
		if (data.action === 'match_found') {
			window.location.href = `/${window.selected_game}/${data.match_id}`;
		}
	});
}

function onUnload() {
	document.getElementById('gameSelector').disabled = false;
	if (socket && socket.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify({
			action: 'cancel_matchmaking'
		}));
	}
}

export { onLoad, onUnload };