var socket;
var playerPosition = { x: 50, y: 250 };
var opponentPosition = { x: 750, y: 250 };
var ballPosition = { x: 400, y: 300 };
var canvas, ctx;
var playerRole = '';  //Variable to store the player's role ('left' or 'right')
var playerId = 0;
var scores = [0,0];
var countdown = 0;
var gameFinished = false;

// var active_player = 0;

let keysPressed = { ArrowUp: false, ArrowDown: false };
let velocity = 0; // Vitesse du joueur
const SPEED = 300; // Pixels par seconde
let lastSent = 0; // Pour le débouncing
const SEND_INTERVAL = 16; // ms (~60 FPS)


function onLoad() {
	if (window.user === undefined) {
		console.log('User not authenticated');
		return;
	}
    console.log("La page charge!");
    canvas = document.getElementById('pongCanvas');
    ctx = canvas.getContext('2d');

    // Initialize WebSocket connection
    socket = new WebSocket('ws://localhost:8042/ws/pong/' + window.location.pathname.split('/')[2] + "/" + window.user.id);

    // Event listener for WebSocket open event
    socket.addEventListener('open', function () {
        console.log('Connected to WebSocket server.');
        startGameLoop()
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
            if (playerRole === 'right'){
				playerPosition.x = 750
				playerId = 2;
			}
			console.log("My role is: " + playerRole)
        }

        // if (data.active_player) {
        //     active_player = data.active_player
        //     console.log(`You are the ${playerRole} player.`);
        //     console.log(`number of active player: ${data.active_player}` )
        // }

        if (data.countdown !== undefined) {
            countdown = data.countdown
        }

        // Handle the game state update
        if (data.type === 'gamestate'){
            if (data.scores) {
                scores[0] = data.scores[1];
                scores[1] = data.scores[2];
            }
            if (data.players) {
                if (playerRole === 'left') {
                    //  playerPosition = data.players[1] || playerPosition;
                    opponentPosition.y = data.players[2]['y'] || opponentPosition.y;
                } else if (playerRole === 'right') {
                    // playerPosition = data.players[2] || playerPosition;
                    opponentPosition.y = data.players[1]['y'] || opponentPosition.y;
                }
            }
            if (data.ball) {
                ballPosition = data.ball;
            }
            
            if (data.winner !== 0){
                gameFinished = true
                if (data.winner === window.user.id){
                    //winning screen
                    console.log("u won wp" + data.winner + " - " + window.user.id)
                }
                else {
                    //losing screen
                    console.log("u lost" + data.winner + " - " + window.user.id)
                }
                //close websocket
                socket.close()
                //stop rendering

                //create a go home button
            }
        }
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
        if (e.key === 'ArrowUp') keysPressed.ArrowUp = true;
        if (e.key === 'ArrowDown') keysPressed.ArrowDown = true;
        this.event.preventDefault()
    });
    
    window.addEventListener('keyup', function (e) {
        if (e.key === 'ArrowUp') keysPressed.ArrowUp = false;
        if (e.key === 'ArrowDown') keysPressed.ArrowDown = false;
    });

}
function startGameLoop(){
    let lastTime = 0;
    function gameLoop(timestamp) {
        const deltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        update(deltaTime);
        draw();
        requestAnimationFrame(gameLoop);
    }
    if (gameFinished)
        return
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    if (keysPressed.ArrowUp) velocity = -SPEED;
    else if (keysPressed.ArrowDown) velocity = SPEED;
    else velocity = 0;
    
    playerPosition.y += velocity * deltaTime;
    if (playerPosition.y < 0) playerPosition.y = 0;
    if (playerPosition.y > 600 - 100) playerPosition.y = 600 - 100;

    const now = performance.now();
    if (now - lastSent >= SEND_INTERVAL) {
        sendPlayerPosition();
        lastSent = now;
    }
}

// Send player position to server whenever it changes
function sendPlayerPosition() {
    const message = {
        type: 'move',
        position: playerPosition
    };
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    }
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
    if (countdown > 0) {
        ctx.fillStyle = 'white';
        ctx.font = "80px Arial";
        ctx.fillText("" + countdown, canvas.width/2 - 40, canvas.height/2);
    }
    else {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(ballPosition.x, ballPosition.y, 10, 0, Math.PI * 2);
        ctx.fill();
    }

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