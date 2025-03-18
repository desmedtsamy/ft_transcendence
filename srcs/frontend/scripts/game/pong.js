var socket;
var playerPosition = { x: 50, y: 150 };
var opponentPosition = { x: 750, y: 150 };
var ballPosition = { x: 400, y: 200 };
var canvas, ctx;
var playerRole = '';  //Variable to store the player's role ('left' or 'right')
var playerId = 0;
var scores = [0,0];
var countdown = 0;
var gameFinished = false;
var win = false;
var opponentConnected = false;
var gamePaused = false;
// Pseudos des joueurs
var player1Username = "player1";
var player2Username = "player2";

// Constantes pour le style néon
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 7;
const NEON_COLOR = '#16e0bd';
const BG_COLOR = '#1a1a2e';

let keysPressed = { ArrowUp: false, ArrowDown: false };
let velocity = 0; // Vitesse du joueur
const SPEED = 300; // Pixels par seconde
let lastSent = 0; // Pour le débouncing
const SEND_INTERVAL = 16; // ms (~60 FPS)

const handleKeyDown = function (e) {
    if (e.key === 'ArrowUp') {
        keysPressed.ArrowUp = true;
        e.preventDefault();
    }
    if (e.key === 'ArrowDown') {
        keysPressed.ArrowDown = true;
        e.preventDefault();
    }
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
    
    document.body.setAttribute('data-game', 'pong');

    canvas = document.getElementById('pongCanvas');
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    socket = new WebSocket('wss://' + window.location.host + '/wss/pong/' + window.location.pathname.split('/')[2] + "/" + window.user.id);

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
        
        // If the server sends player usernames (pour préparer l'intégration future)
        if (data.usernames) {
            if (data.usernames.player1) {
                player1Username = data.usernames.player1;
            }
            if (data.usernames.player2) {
                player2Username = data.usernames.player2;
            }
        }
        
        // If the server sends the player's role
        if (data.type === 'role') {
            const Message = document.getElementById('player-turn');
            playerRole = data.role;  // Store the player's role ('left' or 'right')
            Message.textContent = "I am the : " + playerRole + " player";
			playerPosition.y = 150;
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
                document.getElementById('back_to_menu').style = "visibility:visible;";
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
                
                document.getElementById('back_to_menu').style = "visibility:visible;";
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
    if (playerPosition.y > 400 - PADDLE_HEIGHT) playerPosition.y = 400 - PADDLE_HEIGHT;
    
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

    // Draw center line with néon effect
    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = 'rgba(22, 224, 189, 0.4)'; // Néon color with transparency
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Dessin des raquettes avec effet néon
    // Raquette joueur
    ctx.fillStyle = NEON_COLOR;
    ctx.shadowBlur = 15;
    ctx.shadowColor = NEON_COLOR;
    ctx.fillRect(playerPosition.x, playerPosition.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    
    // Raquette adversaire
    ctx.fillRect(opponentPosition.x, opponentPosition.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Désactiver les ombres pour le reste
    ctx.shadowBlur = 0;

    // Draw ball
    if (countdown > 0) {
        ctx.fillStyle = NEON_COLOR;
        ctx.font = "80px VT323";
        ctx.textAlign = 'center';
        ctx.fillText("" + countdown, canvas.width/2, canvas.height/2);
    }
    else {
        // Dessiner la balle avec effet néon
        ctx.fillStyle = NEON_COLOR;
        ctx.shadowBlur = 20;
        ctx.shadowColor = NEON_COLOR;
        ctx.beginPath();
        ctx.arc(ballPosition.x, ballPosition.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Dessin du score avec effet néon
    ctx.fillStyle = NEON_COLOR;
    ctx.shadowBlur = 15;
    ctx.shadowColor = NEON_COLOR;
    ctx.font = "48px VT323";
    ctx.textAlign = 'center';
    ctx.fillText(scores[0] + " | " + scores[1], canvas.width/2, 70);
    
    // Affichage des pseudos des joueurs
    ctx.font = "28px VT323";
    ctx.shadowBlur = 10;
    
    // Pseudo du joueur 1 à gauche
    ctx.textAlign = 'left';
   
	ctx.fillStyle = NEON_COLOR;
	ctx.shadowColor = NEON_COLOR;
    ctx.fillText(player1Username, 40, 40);
    
    // Pseudo du joueur 2 à droite
    ctx.textAlign = 'right';
	ctx.fillStyle = NEON_COLOR;
	ctx.shadowColor = NEON_COLOR;
    ctx.fillText(player2Username, canvas.width - 40, 40);
    
    ctx.shadowBlur = 0;
}

function drawEndScreen(win) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = "150px VT323";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
	ctx.shadowBlur = 20;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;

    if (win) {
        ctx.fillStyle = NEON_COLOR;
        ctx.shadowColor = NEON_COLOR;
        ctx.fillText("Victory", canvas.width / 2, canvas.height / 2);
        
        // Afficher qui a gagné
        ctx.font = "36px VT323";
        ctx.fillStyle = '#NEON_COLOR';
        ctx.shadowColor = '#NEON_COLOR';
        ctx.shadowBlur = 10;
        const winnerUsername = (playerRole === 'left') ? player1Username : player2Username;
        ctx.fillText(winnerUsername + " wins!", canvas.width / 2, canvas.height / 2 + 80);
    } else {
        ctx.fillStyle = 'red';
        ctx.shadowColor = 'red';
        ctx.fillText("Defeat", canvas.width / 2, canvas.height / 2);
        
        // Afficher qui a gagné
        ctx.font = "36px VT323";
        ctx.fillStyle = '#NEON_COLOR';
        ctx.shadowColor = '#NEON_COLOR';
        ctx.shadowBlur = 10;
        const winnerUsername = (playerRole === 'left') ? player2Username : player1Username;
        ctx.fillText(winnerUsername + " wins!", canvas.width / 2, canvas.height / 2 + 80);
    }
    
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

	document.getElementById('back_to_menu').style = "visibility:visible;";
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