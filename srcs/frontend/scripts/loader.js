let board = Array(9).fill('');
let gameLoopId;
const moveSequence = ['X', 'O', 'X', 'O', 'X', 'X', 'O', 'X', 'O'];
const moveOrder = [2, 1, 6, 5, 0, 4, 7, 8, 3];

function initBoard() {
    const cells = document.querySelectorAll('.cell');
    if (!cells || cells.length !== 9) {
        console.error('Cells not found');
        return false;
    }
    return cells;
}

function resetGame(cells) {
    board = Array(9).fill('');
    cells.forEach(cell => cell.textContent = '');
    startGame(cells)
}

function startGame(cells) {
    let moveIndex = 0;
    gameLoopId = setInterval(() => {
        if (moveIndex < moveSequence.length) {
            const currentCellIndex = moveOrder[moveIndex];
            makeMove(currentCellIndex, moveSequence[moveIndex], cells);
            moveIndex++;
        } else {
            clearInterval(gameLoopId);
            setTimeout(() => resetGame(cells), 100);
        }
    }, 420);
}

function makeMove(index, player, cells) {
    if (board[index] === '') {
        board[index] = player;
        cells[index].textContent = player;
    }
}

function setTicTacToeLoader (elem){
	if (elem == null) {
		elem = document.getElementById('app');
	}
	elem.innerHTML = `
		<div class="board" id="board">
			<div class="cell" data-index="0"></div>
			<div class="cell" data-index="1"></div>
			<div class="cell" data-index="2"></div>
			<div class="cell" data-index="3"></div>
			<div class="cell" data-index="4"></div>
			<div class="cell" data-index="5"></div>
			<div class="cell" data-index="6"></div>
			<div class="cell" data-index="7"></div>
			<div class="cell" data-index="8"></div>
		</div>
	`;

	const cells = initBoard();
    if (!cells) return;
    startGame(cells);
}

function deleteTicTacToeLoader() {
	if (gameLoopId) {
		clearInterval(gameLoopId);
	}
	board = Array(9).fill(''); // Réinitialiser le tableau de jeu
	const boardElement = document.getElementById('board');
	if (boardElement) {
		boardElement.remove(); // Supprimer l'élément du DOM
	}
}

function setPongLoader() {
	const app = document.getElementById('app');
	const title = document.createElement('div');
	title.innerHTML = 'Chargement...';
	app.appendChild(title);
	const spinner = document.createElement('div');
	spinner.className = 'pong-spinner';
	spinner.innerHTML = `
		<div class="paddle-spinner paddle-spinner-left"></div>
		<div class="ball"></div>
		<div class="paddle-spinner paddle-spinner-right"></div>
	`;
	app.appendChild(spinner);
}