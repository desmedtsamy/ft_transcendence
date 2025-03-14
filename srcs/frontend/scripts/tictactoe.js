var socket;
var playerRole = '';
var playerTurn = false;  // Cette variable va déterminer si c'est le tour du joueur
var gameFinished = false;
var win = false;
var board = ['', '', '', '', '', '', '', '', ''];
var currentPlayer = '';  // Ajout de la variable currentPlayer

function onLoad() {
    if (window.user === undefined) {
        console.log('User not authenticated');
        return;
    }
    console.log("La page charge!");

    // Initialisation de la connexion WebSocket
	socket = new WebSocket('wss://' + window.location.host + '/wss/tictactoe/' + window.location.pathname.split('/')[2] + "/" + window.user.id);

    socket.addEventListener('open', function () {
        console.log('Connected to WebSocket server.');
    });

    socket.addEventListener('message', function (event) {
        try {
            var data = JSON.parse(event.data);
            console.log(data);
            if (data.type === 'redirect') {
                socket.close();
                console.log(data.message);
                window.location.href = data.url;
            }
            
            if (data.type === 'disconnect') {
                handleOpponentDisconnect();
                return;
            }

            // Gestion de la fin de partie après déconnexion prolongée
            if (data.type === 'game_ended') {
                document.getElementById('player-turn').textContent = data.message;
                gameFinished = true;
                return;
            }

            // Si le serveur envoie le rôle du joueur
            if (data.type === 'role') {
                playerRole = data.role;
                console.log("Mon rôle est: " + playerRole);
                document.getElementById('player-role').textContent = "Je suis le joueur: " + playerRole;
                document.getElementById('player-turn').textContent = "C'est le tour de " + currentPlayer;
            }

            // Mise à jour de l'état du jeu
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
                    // Fermeture de WebSocket
                    socket.close();
                    gameFinished = true;
                    if (data.winner === playerRole) {
                        console.log("Vous avez gagné !");
                        win = true;
                        document.getElementById('player-turn').textContent = "Vous avez gagnez";
                    } else {
                        console.log("Vous avez perdu !");
                        document.getElementById('player-turn').textContent = "Vous avez perdu";
                    }
                    document.getElementById('button-wrapper').innerHTML = '<a class="header_link" href="#" data-link="/"><i class="fas fa-home"></i></a>';
                }
            }
        } catch (e) {
            console.log("cpt ", e);
        }
    });

    socket.addEventListener('close', function () {
        console.log('Connexion WebSocket fermée.');
    });

    socket.addEventListener('error', function (error) {
        console.error('Erreur WebSocket:', error);
    });

    window.addEventListener('beforeunload', function () {
        if (socket && socket.readyState === WebSocket.OPEN) {
            console.log("Fermeture de la socket 1")
            socket.close(1000, 'Page refresh');
        }
    });

    window.addEventListener('unload', function () {
        if (socket && socket.readyState === WebSocket.OPEN) {
            console.log("Fermeture de la socket 2")
            socket.close(1000, 'Page is refreshing');
        }
    });
}

document.querySelectorAll('.cell').forEach((cell, index) => {
    cell.addEventListener('click', () => handleCellClick(index));
});

function handleCellClick(index) {
    console.log("je clique");
    if (!gameFinished && playerTurn && board[index] === ' ') {  // On vérifie si le joueur a le droit de jouer
        const message = {cell: index};
        console.log("la conditin d'envoi est respecte");
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
            console.log("j'envoi des trucs au serveurs");
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
        let timeLeft = 61;
        const disconnectMessage = document.getElementById('player-turn');
        const countdown = setInterval(() => {
            timeLeft--;
            if (timeLeft >= 0 && !gameFinished) {
                disconnectMessage.textContent = `Votre adversaire s'est déconnecté. Fin dans ${timeLeft}s`;
            } else {
                console.log("clear");
                clearInterval(countdown);
            }
        }, 1000);
    }
}

function onUnload() {
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
};

export { onLoad, onUnload };
window.onload = onLoad;