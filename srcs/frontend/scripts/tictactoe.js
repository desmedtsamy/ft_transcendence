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
            if (data.type === 'redirect') {
                socket.close();
                console.log(data.message);
                window.location.href = data.url;
            }
            // Si le serveur envoie le rôle du joueur
            if (data.type === 'role') {
                playerRole = data.role;
                console.log("Mon rôle est: " + playerRole);
                currentPlayer = (playerRole === 'X') ? 'X' : 'O';
                playerTurn = (currentPlayer === 'X'); // X commence donc playerTurn est true pour X
                document.getElementById('player-turn').textContent = "C'est le tour de " + currentPlayer;
            }

            // Mise à jour de l'état du jeu
            if (data.type === 'gamestate') {
                if (data.board !== undefined)
                    updateBoard(data.board);
                if (data.winner !== 0) {
                    // Fermeture de WebSocket
                    socket.close();
                    gameFinished = true;
                    if (data.winner === window.user.id) {
                        console.log("Vous avez gagné !");
                        win = true;
                    } else {
                        console.log("Vous avez perdu !");
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
    if (!gameFinished && playerTurn && board[index] === '') {  // On vérifie si le joueur a le droit de jouer
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

function onUnload() {
    gameFinished = false;
    win = false;
    playerTurn = false;
    socket.close();
};

export { onLoad, onUnload };
window.onload = onLoad;