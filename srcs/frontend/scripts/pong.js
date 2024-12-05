var socket;
var playerPosition = { x: 50, y: 250 };
var opponentPosition = { x: 750, y: 250 };
var ballPosition = { x: 400, y: 300 };
var canvas, ctx;
var playerRole = '';  // Variable to store the player's role ('left' or 'right')
var playerId = 0;
var scores = [0,0];
// var countdown = 0;
// var active_player = 0;

function onLoad() {
    console.log("La page charge!");
    canvas = document.getElementById('pongCanvas');
    ctx = canvas.getContext('2d');

    // Initialize WebSocket connection
    socket = new WebSocket('ws://localhost:8042/ws/game/' + window.location.pathname.split('/')[2]);

    // Event listener for WebSocket open event
    socket.addEventListener('open', function () {
        console.log('Connected to WebSocket server.');
    });

    // Event listener for WebSocket message event
    socket.addEventListener('message', function (event) {
        try {
            var data = JSON.parse(event.data);
        } catch (e) {
            console.error("Failed to parse JSON:", event.data);
        }

        // If the server sends the player's role
        if (data.type === 'role') {
            playerRole = data.role;  // Store the player's role ('left' or 'right')
            if (playerRole === 'left')
                playerId = 1;
            if (playerRole === 'right')
                playerId = 2;
            console.log("My role is: " + playerRole)
        }

        // if (data.active_player) {
        //     active_player = data.active_player
        //     console.log(`You are the ${playerRole} player.`);
        //     console.log(`number of active player: ${data.active_player}` )
        // }

        // if (data.countdown !== undefined) {
        //     countdown = data.countdown
        // }

        // Handle the game state update
        if (data.scores) {
            scores[0] = data.scores[1];
            scores[1] = data.scores[2];
        }
        if (data.players) {
            if (playerRole === 'left') {
                playerPosition = data.players[1] || playerPosition;
                opponentPosition = data.players[2] || opponentPosition;
            } else if (playerRole === 'right') {
                playerPosition = data.players[2] || playerPosition;
                opponentPosition = data.players[1] || opponentPosition;
            }
        }
        if (data.ball) {
            ballPosition = data.ball;
        }
        draw();
    });

    // Event listener for WebSocket close event
    socket.addEventListener('close', function () {
        console.log('WebSocket connection closed.');
    });

    // Event listener for WebSocket error event
    socket.addEventListener('error', function (error) {
        console.error('WebSocket error:', error);
    });

    window.addEventListener('beforeunload', function () {
        if (socket && socket.readyState === WebSocket.OPEN) {
            console.log("closing socket 1")
            socket.close(1000, 'Page refresh');
        }
    });
    

    window.addEventListener('unload', function () {
        if (socket && socket.readyState === WebSocket.OPEN) {
                console.log("closing socket 2")
            socket.close(1000, 'Page is refreshing');
        }
    });
    

    // Event listener for player movement
    window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp') playerPosition.y -= 10;
        if (e.key === 'ArrowDown') playerPosition.y += 10;
        if (0 <= playerPosition.y && playerPosition.y <= 600 - 100)
            sendPlayerPosition();
    });
}

// Send player position to server whenever it changes
function sendPlayerPosition() {
    const message = {
        type: 'move',
        position: playerPosition
    };
    socket.send(JSON.stringify(message));
}

// Function to draw the game state (player and ball positions)
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = 'green';
    ctx.fillRect(playerPosition.x, playerPosition.y, 10, 100);

    // Draw opponent
    ctx.fillStyle = 'blue';
    ctx.fillRect(opponentPosition.x, opponentPosition.y, 10, 100);

    // Draw ball
    // if (countdown > 0) {
    //     ctx.fillStyle = 'white';
    //     ctx.font = "80px Arial";
    //     ctx.fillText("" + countdown, canvas.width/2 - 40, canvas.height/2);
    // }
    // else {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(ballPosition.x, ballPosition.y, 10, 0, Math.PI * 2);
        ctx.fill();
    // }

    //draw score
    ctx.fillStyle = 'yellow';
    ctx.font = "20px Arial";
    ctx.fillText(scores[0] + "  |  " + scores[1], canvas.width/2 -25, 20);

    // if (active_player === 1) {
    //     ctx.fillStyle = 'white';
    //     ctx.font = "30px Arial";
    //     ctx.fillText("Waiting for another player", canvas.width/2 -180, canvas.height/3);
    // }
}


export { onLoad }
window.onload = onLoad;
