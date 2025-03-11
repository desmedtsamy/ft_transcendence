function onLoad() {
	document.getElementById('gameSelector').disabled = true;
	let loader = document.getElementById('loader');
	if (window.selected_game === "pong")
		setPongLoader(loader);
	else
		setTicTacToeLoader(loader);
}

function onUnload() {
	document.getElementById('gameSelector').disabled = false;
	// if (window.selected_game === "pong")
	// 	deletePongLoader();
	// else
	// 	deleteTicTacToeLoader();
}
	
export { onLoad, onUnload };