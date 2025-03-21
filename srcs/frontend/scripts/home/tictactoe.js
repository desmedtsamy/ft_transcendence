let board = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = false;
let cells;
let gameLoopId;
const moveDelay = 1000;

function initBoard() {
    cells = document.querySelectorAll('.cell');
    if (!cells || cells.length !== 9) {
        console.error('Cells not found');
        return false;
    }
    return true;
}

function resetGame() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    cells.forEach(cell => cell.textContent = '');
    setTimeout(() => startGame(), 1000);
}

function startGame() {
    gameActive = true;
    playBotMove();
}

function makeMove(index) {
    if (board[index] === '' && gameActive) {
        board[index] = currentPlayer;
        cells[index].textContent = currentPlayer;
        
        if (checkWin()) {
            gameActive = false;
            resetGame();
            return;
        }
        
        if (checkDraw()) {
            gameActive = false;
            resetGame();
            return;
        }

        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        if (gameActive) {
            gameLoopId = setTimeout(() => playBotMove(), moveDelay);
        }
    }
}

function getAvailableMoves() {
    return board.reduce((moves, cell, index) => {
        if (cell === '') moves.push(index);
        return moves;
    }, []);
}

function playBotMove() {
    const availableMoves = getAvailableMoves();
    if (availableMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        const move = availableMoves[randomIndex];
        makeMove(move);
    }
}

function checkWin() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    return winPatterns.some(pattern => {
        const [a, b, c] = pattern;
        return board[a] !== '' &&
               board[a] === board[b] &&
               board[a] === board[c];
    });
}

function checkDraw() {
    return !board.includes('');
}

function handlePlayClick() {
    navigateTo('/matchmaking/');
}

function onLoad() {
    if (!initBoard()) return;
    startGame();
    
    const playButton = document.getElementById('glass');
    if (playButton) {
        playButton.addEventListener('click', handlePlayClick);
    }
}

function onUnload() {
    if (gameLoopId) {
        clearTimeout(gameLoopId);
    }
    gameActive = false;
    
    const playButton = document.getElementById('glass');
    if (playButton) {
        playButton.removeEventListener('click', handlePlayClick);
    }
}

export { onLoad, onUnload };
