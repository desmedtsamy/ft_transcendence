var socket;
var playerRole = '';
var playerTurn = false;  // Cette variable va déterminer si c'est le tour du joueur
var gameFinished = false;
var win = false;
var board = ['', '', '', '', '', '', '', '', ''];
var currentPlayer = '';  // Ajout de la variable currentPlayer
var opponentConnected = false;
var hasVotedRestart = false; // Variable pour suivre si le joueur a voté pour redémarrer

function onLoad() {
    const gameSelector = document.getElementById('gameSelector');
	if (gameSelector) {
		gameSelector.disabled = true;
	}
	if ( localStorage.getItem('selectedGame') != "tictactoe" && window.setSelectedGame) {
		window.setSelectedGame("tictactoe");
	}
    if (window.user === undefined) {
        return;
    }
    
    // Set the game type for styling
    document.body.setAttribute('data-game', 'tictactoe');
    
    // Initialize game controls
    document.getElementById('button-wrapper').innerHTML = `
    <button id="restart-button" class="button">Recommencer</button>
    <button id="quit-button" class="button">Abandonner</button>
    `;
    
    // Setup restart functionality
    document.getElementById('restart-button').disabled = true;
    document.getElementById('restart-button').addEventListener('click', function() {
        const message = { action: 'restart_game' };
        socket.send(JSON.stringify(message));
        hasVotedRestart = true;
        this.disabled = true;
    });

    document.getElementById('quit-button').addEventListener('click', function() {
        const message = { action: 'give_up' };
        socket.send(JSON.stringify(message));
        window.location.href = '/';
    });
    socket = new WebSocket('wss://' + window.location.host + '/wss/tictactoe/' + window.location.pathname.split('/')[2] + "/" + window.user.id);

    socket.addEventListener('open', function () {
    });

    socket.addEventListener('message', function (event) {
        try {
            var data = JSON.parse(event.data);
            if (data.type === 'redirect') {
                socket.close();
                window.location.href = data.url;
            }

            if (data.type === 'opponent connected'){
                opponentConnected = true;
            }
            
            if (data.type === 'disconnect') {
                opponentConnected = false;
                handleOpponentDisconnect();
                return;
            }

            // Gestion de la fin de partie après déconnexion prolongée
            if (data.type === 'game_ended') {
                document.getElementById('player-turn').textContent = "Game won by forfeit";
                gameFinished = true;
                return;
            }
            
            // Réception d'un vote pour redémarrer
            if (data.type === 'restart_vote') {
                document.getElementById('player-turn').textContent = data.message;
                return;
            }
            
            // La partie a été redémarrée après votes
            if (data.type === 'game_restarted') {
                document.getElementById('player-turn').textContent = data.message;
                gameFinished = false;
                hasVotedRestart = false; // Réinitialiser le vote du joueur
                
                // Remplacer les boutons de vote par une notification
                setTimeout(() => {
                    if (!gameFinished) {
                        document.getElementById('player-turn').textContent = "C'est le tour de " + currentPlayer;
                    }
                }, 3000);
                return;
            }
            
            if (data.type === 'game_forfeit') {
                document.getElementById('player-turn').textContent = data.message;
                gameFinished = true;
                document.getElementById('button-wrapper').innerHTML = '<a class="header_link" href="#" data-link="/"><i class="fas fa-home"></i></a>';
                return;
            }

            if (data.type === 'role') {
                playerRole = data.role;
                document.getElementById('player-role').textContent = "Je suis le joueur: " + playerRole;
                document.getElementById('player-turn').textContent = "C'est le tour de " + currentPlayer;
            }

            if (data.type === 'gamestate') {
                currentPlayer = data.turn;
                if (currentPlayer === playerRole){
                    playerTurn = true;
                }
                else{
                    playerTurn = false;
                }
                if (data.board !== undefined)
                    updateBoard(data.board);
                if (data.winner !== 0) {
                    gameFinished = true;
                    if (data.winner === playerRole) {
                        win = true;
                        document.getElementById('player-turn').textContent = "Vous avez gagnez";
                    } 
                    else if (data.winner === 'n'){
                        document.getElementById('player-turn').textContent = "Match nul!";
						document.getElementById('restart-button').disabled = false;
                    }
                    else {
                        document.getElementById('player-turn').textContent = "Vous avez perdu";
                    }
                    
                    // Use our design for game end UI
                    if (data.winner !== 'n') {
                        document.getElementById('button-wrapper').innerHTML = `
                            <a class="header_link" href="#" data-link="/">
                                <i class="fas fa-arrow-circle-left"></i> Back to Menu
                            </a>
                        `;
                    }
                }
            }
        } catch (e) {
            console.log("error while receiving data ", e);
        }
    });

    socket.addEventListener('close', function () {
    });

    socket.addEventListener('error', function (error) {
        console.error('Erreur WebSocket:', error);
    });

    window.addEventListener('beforeunload', function () {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close(1000, 'Page refresh');
        }
    });

    window.addEventListener('unload', function () {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close(1000, 'Page is refreshing');
        }
    });
    document.querySelectorAll('.cell').forEach((cell, index) => {
        cell.addEventListener('click', () => handleCellClick(index));
    });
}


function handleCellClick(index) {
    if (!gameFinished && playerTurn && board[index] === ' ') {  // On vérifie si le joueur a le droit de jouer
        const message = {cell: index};
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    }
}

function updateBoard(boardData) {
    board = boardData;
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        cell.textContent = board[index];
        if (board[index] === 'X') {
            cell.classList.add('x');
            cell.classList.remove('o');
        } else if (board[index] === 'O') {
            cell.classList.add('o');
            cell.classList.remove('x');
        } else {
            cell.classList.remove('x', 'o');
        }
    });

    if (!gameFinished) {
        document.getElementById('player-turn').textContent = "C'est le tour de " + currentPlayer;
    }
}

function handleOpponentDisconnect() {
    if (!gameFinished) {
        let timeLeft = 11;
        const disconnectMessage = document.getElementById('player-turn');
        const countdown = setInterval(() => {
            timeLeft--;
            if (timeLeft >= 0 && !gameFinished && !opponentConnected) {
                disconnectMessage.textContent = `Opponent disconnected ${timeLeft}s left before forfeit`;
            } else {
                clearInterval(countdown);
            }
        }, 1000);
    }
}

function onUnload() {
    const gameSelector = document.getElementById('gameSelector');
	if (gameSelector) {
		gameSelector.disabled = false;
	}
	
    gameFinished = false;
    win = false;
    playerTurn = false;
    if (socket && socket.readyState === WebSocket.OPEN)
        socket.close();
    playerRole = '';
    playerTurn = false;  // Cette able va déterminer si c'est le tour du joueur
    gameFinished = false;
    win = false;
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = '';  // Ajout de la variable currentPlayer
    opponentConnected = false;
    hasVotedRestart = false;
}

// Add rematch handling function
window.handleRematch = function(event) {
    event.preventDefault();
    const opponentId = window.location.pathname.split('/')[3]; // Get opponent ID from URL
    if (opponentId) {
        const rematchUrl = '/game/invite/' + opponentId;
        window.location.href = rematchUrl;
    }
}

export { onLoad, onUnload };
window.onload = onLoad;
