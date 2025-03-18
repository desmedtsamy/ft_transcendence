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
var win = false;
var opponentConnected = false;
var gamePaused = false;

let keysPressed = { ArrowUp: false, ArrowDown: false };
let velocity = 0; // Vitesse du joueur
const SPEED = 300; // Pixels par seconde
let lastSent = 0; // Pour le débouncing
const SEND_INTERVAL = 16; // ms (~60 FPS)

const handleKeyDown = function (e) {
    if (e.key === 'ArrowUp') keysPressed.ArrowUp = true;
    if (e.key === 'ArrowDown') keysPressed.ArrowDown = true;
    e.preventDefault();
};

const handleKeyUp = function (e) {
    if (e.key === 'ArrowUp') keysPressed.ArrowUp = false;
    if (e.key === 'ArrowDown') keysPressed.ArrowDown = false;
};

let listenersAdded = false;

function onLoad() {
    if (listenersAdded) return;
	if (window.user === undefined) {
		console.log('User not authenticated');
		return;
	}
    console.log("La page charge!");
    canvas = document.getElementById('pongCanvas');
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Initialize WebSocket connection
	socket = new WebSocket('wss://' + window.location.host + '/wss/pong/' + window.location.pathname.split('/')[2] + "/" + window.user.id);

    // Event listener for WebSocket open event
    socket.addEventListener('open', function () {
        console.log('Connected to WebSocket server.');
        startGameLoop();
    });

    socket.addEventListener('message', function (event) {
    try {
        var data = JSON.parse(event.data);
        if (data.type === 'redirect'){
            socket.close();
            console.log(data.message);
            window.location.href = data.url;
        }

        if (data.type === 'disconnect') {
            handleOpponentDisconnect();
        }

        if (data.type === 'opponent connected') {
            opponentConnected = true;
            gamePaused = false;
            const disconnectMessage = document.getElementById('player-turn');
            disconnectMessage.textContent = "I am the : " + playerRole + " player";
            if (window.disconnectTimer) {
                clearInterval(window.disconnectTimer);
                window.disconnectTimer = null;
            }
        }
        // If the server sends the player's role
        if (data.type === 'role') {
            const Message = document.getElementById('player-turn');
            playerRole = data.role;  // Store the player's role ('left' or 'right')
            Message.textContent = "I am the : " + playerRole + " player";
			playerPosition.y = 250;
            if (playerRole === 'left'){
				console.log("gauche")
                playerPosition.x = 50;
                opponentPosition.x = 750;
                playerId = 1;
            }
            if (playerRole === 'right'){
				console.log("droite")
                playerPosition.x = 750;
                opponentPosition.x = 50;
                playerId = 2;
            }
            console.log("My role is: " + playerRole);
        }
    
        if (data.countdown !== undefined) {
            countdown = data.countdown;
        }
    
        // Handle the game state update
        if (data.type === 'gamestate'){
            if (data.scores) {
                scores[0] = data.scores[1];
                scores[1] = data.scores[2];
            }
            if (data.players) {
                if (playerRole === 'left') {
                    opponentPosition.y = data.players[2].y || opponentPosition.y;
                } else if (playerRole === 'right') {
                    opponentPosition.y = data.players[1].y || opponentPosition.y;
                }
            }
            if (data.ball) {
                ballPosition = data.ball;
            }
            
            if (data.winner !== 0){
                //close websocket
                socket.close();
                gameFinished = true
                if (data.winner === window.user.id){
                    //winning screen
                    console.log("u won wp" + data.winner + " - " + window.user.id);
                    win = true;
                }
                else {
                    //losing screen
                    console.log("u lost" + data.winner + " - " + window.user.id);
                }
                document.getElementById('button-wrapper').innerHTML = '<a class="header_link" href="#" data-link="/"><i class="fas fa-home"></i></a>';
            }
        }
        
    } catch (e) {
        console.error("Failed to parse JSON:", event.data);
		console.log(e);
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
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}
let gameLoopRunning = false;
function startGameLoop(){
    let lastTime = 0;
    gameLoopRunning = true
    function gameLoop(timestamp) {
        if (gameFinished || !gameLoopRunning){
            if (gameFinished)
                drawEndScreen(win);
            return;
        }
        const deltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        if (!gamePaused) {
            update(deltaTime);
            draw();
        } 
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
}

function handleOpponentDisconnect() {
    if (!gameFinished) {
        opponentConnected = false;
        gamePaused = true; // Mettre le jeu en pause
        let timeLeft = 10;
        const disconnectMessage = document.getElementById('player-turn');
        
        if (window.disconnectTimer) {
            clearInterval(window.disconnectTimer);
        }

        window.disconnectTimer = setInterval(() => {
            if (gameFinished || opponentConnected) {
                disconnectMessage.textContent = "I am the : " + playerRole + " player";
                clearInterval(window.disconnectTimer);
                window.disconnectTimer = null;
                return;
            }

            if (timeLeft >= 0) {
                disconnectMessage.textContent = `Opponent disconnected ${timeLeft}s left before forfeit`;
                timeLeft--;
            } else {
                gameFinished = true;
                disconnectMessage.textContent = "Game won by forfeit";
                win = true;
                drawEndScreen(win);
                clearInterval(window.disconnectTimer);
                window.disconnectTimer = null;
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.close();
                }
                document.getElementById('button-wrapper').innerHTML = '<a class="header_link" href="#" data-link="/"><i class="fas fa-home"></i></a>';
            }
        }, 1000);
    }
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
let lastY = playerPosition.y;
function sendPlayerPosition() {
    if (playerPosition.y !== lastY) {
        const message = { type: 'move', position: playerPosition };
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
        lastY = playerPosition.y;
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
}

function drawEndScreen(win) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "150px Audiowide";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (win) {
        ctx.fillStyle = 'gold';
        ctx.fillText("Victory", canvas.width / 2, canvas.height / 2);
    } else {
        ctx.fillStyle = 'red';
        ctx.fillText("Defeat", canvas.width / 2, canvas.height / 2);
    }
}

function onUnload(){
    gameLoopRunning = false;
    console.log("onunload appele")
    keysPressed = { ArrowUp: false, ArrowDown: false };
    velocity = 0;
    lastSent = 0;

    // Supprimer les écouteurs clavier
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameFinished = false;
    win = false;
    socket.close();
}

export { onLoad, onUnload }
window.onload = onLoad;