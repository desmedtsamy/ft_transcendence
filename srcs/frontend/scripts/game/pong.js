var socket;
var playerPosition = { x: 50, y: 150 };  // Toujours à gauche
var opponentPosition = { x: 750, y: 150 };  // Toujours à droite
var ballPosition = { x: 400, y: 200 };
var canvas, ctx;
var playerId = 0;
var scores = [0,0];
var countdown = 0;
var gameFinished = false;
var win = false;
var opponentConnected = false;
var gamePaused = false;
// Pseudos des joueurs
var myUsername = "player1";  // Le nom du joueur courant
var opponentUsername = "player2";  // Le nom de l'adversaire

// Constantes pour le style néon
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 7;
const NEON_COLOR = '#16e0bd';
const BG_COLOR = '#1a1a2e';

let keysPressed = { ArrowUp: false, ArrowDown: false };
let velocity = 0; // Vitesse du joueur
const SPEED = 600; // Pixels par seconde
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

function resetGameState() {
    // Reset all game-related variables to their initial state
    playerPosition = { x: 50, y: 150 };
    opponentPosition = { x: 750, y: 150 };
    ballPosition = { x: 400, y: 200 };
    scores = [0, 0];
    countdown = 0;
    gameFinished = false;
    win = false;
    opponentConnected = false;
    gamePaused = false;
    myUsername = "player1";
    opponentUsername = "player2";
    keysPressed = { ArrowUp: false, ArrowDown: false };
    velocity = 0;
    lastSent = 0;
}

function onLoad() {
    const gameSelector = document.getElementById('gameSelector');
	if (gameSelector) {
		gameSelector.disabled = true;
	}
	if ( localStorage.getItem('selectedGame') != "pong" && window.setSelectedGame) {
		window.setSelectedGame("pong");
	}
    if (listenersAdded) return;
    if (window.user === undefined) {
        return;
    }
    
    resetGameState();

    document.body.setAttribute('data-game', 'pong');

    canvas = document.getElementById('pongCanvas');
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket = new WebSocket('wss://' + window.location.host + '/wss/pong/' + window.location.pathname.split('/')[2] + "/" + window.user.id);

    socket.addEventListener('open', function () {
        sendPlayerPosition();
        startGameLoop();
    });

    socket.addEventListener('message', function (event) {
    try {
        var data = JSON.parse(event.data);
        if (data.type === 'redirect'){
            socket.close();
            window.location.href = data.url;
        }

        if (data.type === 'waiting'){
            const disconnectMessage = document.getElementById('player-turn');
            disconnectMessage.textContent = 'Waiting for the other player';
        }

        if (data.type === 'disconnect') {
            handleOpponentDisconnect();
        }

        if (data.type === 'game_ended'){
            gameFinished = true;
            const disconnectMessage = document.getElementById('player-turn');
            disconnectMessage.textContent = "Game won by forfeit";
            win = true;
			document.getElementById("mobile-controls").classList.add("hidden");
            drawEndScreen(win);
            clearInterval(window.disconnectTimer);
            window.disconnectTimer = null;
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
            
            document.getElementById('back_to_menu').style = "visibility:visible;";
        }

        if (data.type === 'opponent connected') {
            opponentConnected = true;
            gamePaused = false;
            const disconnectMessage = document.getElementById('player-turn');
            disconnectMessage.textContent = "";
            if (window.disconnectTimer) {
                clearInterval(window.disconnectTimer);
                window.disconnectTimer = null;
            }
        }
        
        // If the server sends the player's role
        if (data.type === 'role') {
            playerPosition.y = 150;
            playerPosition.x = 50;    // Toujours à gauche
            opponentPosition.x = 750; // Toujours à droite
            
            // Mise à jour des pseudos
            myUsername = data.player1;
            opponentUsername = data.player2;
        }
    
        if (data.countdown !== undefined) {
            countdown = data.countdown;
        }
    
        // Handle the game state update
        if (data.type === 'gamestate'){
            if (data.scores) {
                scores[0] = data.scores[1];  // Mon score (côté gauche)
                scores[1] = data.scores[2];  // Score de l'adversaire (côté droit)
            }
            
            if (data.players) {
                opponentPosition.y = data.players[2].y || opponentPosition.y;
            }
            
            if (data.ball) {
                ballPosition = data.ball;
            }
            
            if (data.winner !== 0){
                socket.close();
                gameFinished = true;
                if (data.winner === window.user.id){
                    win = true;
                }
                document.getElementById('back_to_menu').style = "visibility:visible;";
            }
            else {
                gameFinished = false;
            }
        }
        
    } catch (e) {
        console.error("Failed to parse JSON:", event.data);
    }
    
    });

    // Event listener for WebSocket close event
    socket.addEventListener('close', function () {
    });
    
    // Event listener for WebSocket error event
    socket.addEventListener('error', function (error) {
        console.error('WebSocket error:', error);
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
    
    // Event listener for player movement
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Add event listeners for mobile controls
    addMobileControls();
}

function addMobileControls() {
    const moveUpButton = document.getElementById('move-up');
    const moveDownButton = document.getElementById('move-down');

    if (moveUpButton && moveDownButton) {
        // Touch events
        moveUpButton.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            keysPressed.ArrowUp = true;
        });

        moveUpButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            keysPressed.ArrowUp = false;
        });

        moveDownButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keysPressed.ArrowDown = true;
        });

        moveDownButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            keysPressed.ArrowDown = false;
        });
    }
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
        let timeLeft = 30;
        const disconnectMessage = document.getElementById('player-turn');
        
        if (window.disconnectTimer) {
            clearInterval(window.disconnectTimer);
        }

        window.disconnectTimer = setInterval(() => {
            if (gameFinished || opponentConnected) {
                disconnectMessage.textContent = "I am the : left player";
                clearInterval(window.disconnectTimer);
                window.disconnectTimer = null;
                return;
            }

            if (timeLeft >= 0) {
                disconnectMessage.textContent = `Opponent disconnected ${timeLeft}s left before forfeit`;
                timeLeft--;
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

// Function to draw the game state
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw center line with néon effect
    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = 'rgba(22, 224, 189, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Dessin des raquettes avec effet néon
    ctx.fillStyle = NEON_COLOR;
    ctx.shadowBlur = 15;
    ctx.shadowColor = NEON_COLOR;
    
    // Raquette joueur (gauche)
    ctx.fillRect(playerPosition.x, playerPosition.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    
    // Raquette adversaire (droite)
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
    
    // Mon pseudo à gauche
    ctx.textAlign = 'left';
    ctx.fillStyle = 'NEON_COLOR';  // Moi en surbrillance
    ctx.shadowColor = 'NEON_COLOR';
    ctx.fillText(myUsername, 40, 40);
    
    // Pseudo adversaire à droite
    ctx.textAlign = 'right';
    ctx.fillStyle = NEON_COLOR;
    ctx.shadowColor = NEON_COLOR;
    ctx.fillText(opponentUsername, canvas.width - 40, 40);
    
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
        ctx.fillText("Victory", canvas.width / 2, canvas.height / 3);
        
        // Afficher qui a gagné
        ctx.font = "36px VT323";
        ctx.fillStyle = 'NEON_COLOR';
        ctx.shadowColor = 'NEON_COLOR';
        ctx.shadowBlur = 10;
        ctx.fillText(myUsername + " wins!", canvas.width / 2, canvas.height / 3 + 80);
    } else {
        ctx.fillStyle = 'red';
        ctx.shadowColor = 'red';
        ctx.fillText("Defeat", canvas.width / 2, canvas.height / 3);
        
        // Afficher qui a gagné
        ctx.font = "36px VT323";
        ctx.fillStyle = 'NEON_COLOR';
        ctx.shadowColor = 'NEON_COLOR';
        ctx.shadowBlur = 10;
        ctx.fillText(opponentUsername + " wins!", canvas.width / 2, canvas.height / 3 + 80);
    }
    
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    document.getElementById('back_to_menu').style = "visibility:visible;";
}

function onUnload(){
    const gameSelector = document.getElementById('gameSelector');
	if (gameSelector) {
		gameSelector.disabled = false;
	}
    gameLoopRunning = false;
    // Supprimer les écouteurs clavier
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
    }
    resetGameState();
}

export { onLoad, onUnload }
window.onload = onLoad;