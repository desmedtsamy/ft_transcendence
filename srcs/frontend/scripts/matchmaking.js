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

function setPongLoader(loader) {
	loader.innerHTML = `
		<div class="pong-spinner">
			<div class="paddle-spinner paddle-spinner-left"></div>
			<div class="ball"></div>
			<div class="paddle-spinner paddle-spinner-right"></div>
		</div>
	`;
}

function setTicTacToeLoader(loader) {
	loader.innerHTML = `
		<div class="tic-tac-toe-spinner">
			<div class="board">
				<div class="cell"></div>
				<div class="cell"></div>
				<div class="cell"></div>
				<div class="cell"></div>
				<div class="cell"></div>
				<div class="cell"></div>
				<div class="cell"></div>
				<div class="cell"></div>
				<div class="cell"></div>
			</div>
		</div>
	`;
}

export { onLoad, onUnload };