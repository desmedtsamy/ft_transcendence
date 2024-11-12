var socket;
var playerPosition = { x: 50, y: 250 };
var opponentPosition = { x: 50, y: 250 };
var ballPosition = { x: 400, y: 300 };
var canvas, ctx;

function onLoad() {
    canvas = document.getElementById('pongCanvas');
    ctx = canvas.getContext('2d');

    var id = 42;
    if (window.user === undefined) {
        console.log('User not authenticated');
    } else {
        id = window.user.id;
    }

    console.log("User ID: [" + id + "]");

    socket = new WebSocket('ws://localhost:8003/ws/game/' + id);

    socket.addEventListener('open', function (event) {
        console.log('WebSocket is open now.');
    });

    socket.addEventListener('message', function (event) {0
        var data = JSON.parse(event.data);
        if (data.type === 'ball_update') {
            ballPosition = data.position;
			if (user.id == 2)
			{
				ballPosition.x = canvas.width - ballPosition.x;
				ballPosition.y = canvas.height - ballPosition.y;
			}
			console.log('Ball position:', ballPosition);
        } else if (data.type === 'player_update') {
            opponentPosition = data.position;
        }
        drawGame(); // Redessine à chaque mise à jour
    });

    window.addEventListener('keydown', function (event) {
        handlePlayerMove(event);
        drawGame();  // Redessine le jeu après le mouvement
    });

    socket.onerror = function (error) {
        alert(`[error] ${error.message}`);
    };

    drawGame();  // Dessine le jeu la première fois
}

function handlePlayerMove(event) {
    if (event.code === 'ArrowUp') {
        playerPosition.y -= 10;
    } else if (event.code === 'ArrowDown') {
        playerPosition.y += 10;
    }

    var moveData = {
        type: 'move',
        position: playerPosition
    };
    socket.send(JSON.stringify(moveData));
}

function drawGame() {
    // Efface le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessine les joueurs
    drawPlayer(playerPosition, 'blue');
	 
	// Inverser la position x de l'adversaire pour l'afficher de manière symétrique
	 var opponentPositionInverted = { 
        x: canvas.width - opponentPosition.x - 20, // 20 étant la largeur du paddle
        y: canvas.height - opponentPosition.y - 100 // 100 étant la hauteur du paddle
    };
    drawPlayer(opponentPositionInverted, 'red');

    // Dessine la balle
    drawBall(ballPosition);
}

function drawPlayer(position, color) {
    ctx.fillStyle = color;
    ctx.fillRect(position.x, position.y, 20, 100);
}

function drawBall(position) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(position.x, position.y, 10, 0, Math.PI * 2);
    ctx.fill();
}

export { onLoad };
window.onload = onLoad;
