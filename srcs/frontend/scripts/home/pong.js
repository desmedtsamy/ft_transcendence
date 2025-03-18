const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 120;
const BALL_RADIUS = 7;
const NEON_COLOR = '#16e0bd';
const BG_COLOR = '#1a1a2e';

const ball = {
  x: 0,
  y: 0,
  radius: BALL_RADIUS,
  speed: 5,
  dx: 5,
  dy: 5
};

const leftPaddle = {
  x: 10,
  y: 0,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};

const rightPaddle = {
  x: 0,
  y: 0,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};

let canvas;
let ctx;
let gameLoopId;


function initCanvas() {
	canvas = document.getElementById('gameCanvas');
	if (!canvas) {
		console.error('Canvas not found');
		return false;
	}
	ctx = canvas.getContext('2d');
	return true;
}

function drawPaddle(paddle) {
	ctx.fillStyle = NEON_COLOR;
	ctx.shadowBlur = 15;
	ctx.shadowColor = NEON_COLOR;
	ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
	ctx.shadowBlur = 20;
	ctx.shadowColor = NEON_COLOR;
	ctx.beginPath();
	ctx.fillStyle = NEON_COLOR;
	ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
	ctx.fill();
}

function movePaddles() {
	if (ball.dx < 0) {
		leftPaddle.y = Math.max(0, Math.min(canvas.height - leftPaddle.height, ball.y - leftPaddle.height / 2));
	} else {
		rightPaddle.y = Math.max(0, Math.min(canvas.height - rightPaddle.height, ball.y - rightPaddle.height / 2));
	}
}

function updateBall() {
	ball.x += ball.dx;
	ball.y += ball.dy;
	
	if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
		ball.dy *= -1;
	}
	
	if (
		(ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
			ball.y > leftPaddle.y &&
			ball.y < leftPaddle.y + leftPaddle.height) ||
			(ball.x + ball.radius > rightPaddle.x &&
				ball.y > rightPaddle.y &&
				ball.y < rightPaddle.y + rightPaddle.height)
			) {
				ball.dx *= -1;
				ball.dy += (Math.random() - 0.5);
			}
			
			if (ball.x < 0 || ball.x > canvas.width) {
				ball.x = canvas.width / 2;
				ball.y = canvas.height / 2;
				ball.dx *= Math.random() > 0.5 ? 1 : -1;
			}
		}
		
		function gameLoop() {
			if (!canvas || !ctx) {
				console.error('Canvas or context not available');
				return;
			}
			
			ctx.fillStyle = BG_COLOR;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			
			// Dessiner la ligne centrale avec effet néon
			ctx.beginPath();
			ctx.setLineDash([10, 10]);
			ctx.moveTo(canvas.width / 2, 0);
			ctx.lineTo(canvas.width / 2, canvas.height);
			ctx.strokeStyle = 'rgba(22, 224, 189, 0.4)';
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.setLineDash([]);
			
			// Afficher un score de démo statique
			ctx.fillStyle = NEON_COLOR;
			ctx.shadowBlur = 15;
			ctx.shadowColor = NEON_COLOR;
			ctx.font = "48px VT323";
			ctx.textAlign = 'center';
			ctx.fillText("0 | 0", canvas.width/2, 70);
			ctx.shadowBlur = 0;
			
			movePaddles();
			updateBall();
			
			drawPaddle(leftPaddle);
			drawPaddle(rightPaddle);
			ctx.shadowBlur = 0; // Réinitialiser après les raquettes
			drawBall();
			ctx.shadowBlur = 0; // Réinitialiser après la balle
			
			gameLoopId = requestAnimationFrame(gameLoop);
		}
		
		function handlePlayClick() {
		  navigateTo('/matchmaking/');
		}
		function onLoad() {
			if (!initCanvas()) {
				console.error('Failed to initialize canvas');
				return;
			}
			
			// Reset ball position
			ball.x = canvas.width / 2;
			ball.y = canvas.height / 2;
			ball.dx = 5;
			ball.dy = 5;
			
			// Reset paddle positions
			leftPaddle.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
			rightPaddle.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
			rightPaddle.x = canvas.width - 25 - PADDLE_WIDTH;
			
			// Start the game loop
			gameLoop();
			
			// Initialize play button
			const playButton = document.getElementById('glass');
			if (playButton) {
				playButton.addEventListener('click', handlePlayClick);
			}
		}
		
		function onUnload() {
			// Stop the game loop if needed
			if (gameLoopId) {
				cancelAnimationFrame(gameLoopId);
				gameLoopId = null;
			}
			
			// Remove event listener
			const playButton = document.getElementById('glass');
			if (playButton) {
				playButton.removeEventListener('click', handlePlayClick);
			}
			
			// Clear references
			canvas = null;
			ctx = null;
		}
	export { onLoad, onUnload };