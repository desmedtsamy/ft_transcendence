let socket;


function onLoad() {
	const gameSelector = document.getElementById('gameSelector');
	if (gameSelector) {
		gameSelector.disabled = true;
		gameSelector.value = window.selected_game || 'pong';
	}

	let loader = document.getElementById('loader');
	if (window.selected_game === "pong") {
		setPongLoader(loader);
	} else {
		setTicTacToeLoader(loader);
	}

	socket = new WebSocket('wss://' + window.location.host + '/wss/matchmaking/' + window.user.id);
	socket.addEventListener('open', function () {
		const gameType = window.selected_game || 'pong';
		socket.send(JSON.stringify({
			action: 'find_match',
			game_type: gameType
		}));
	});
}

function onUnload() {
	const gameSelector = document.getElementById('gameSelector');
	if (gameSelector) {
		gameSelector.disabled = false;
	}
	
	if (socket && socket.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify({
			action: 'cancel_matchmaking'
		}));
	}
}

export { onLoad, onUnload };