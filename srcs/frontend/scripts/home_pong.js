const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 120;
const BALL_RADIUS = 7;

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
	ctx.fillStyle = '#16e0bd';
	ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
	ctx.beginPath();
	ctx.fillStyle = '#16e0bd';
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
			
			ctx.fillStyle = '#1a1a2e';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			
			ctx.beginPath();
			ctx.setLineDash([10, 10]);
			ctx.moveTo(canvas.width / 2, 0);
			ctx.lineTo(canvas.width / 2, canvas.height);
			ctx.strokeStyle = 'rgba(0,255,136,0.2)';
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.setLineDash([]);
			
			movePaddles();
			updateBall();
			
			drawPaddle(leftPaddle);
			drawPaddle(rightPaddle);
			drawBall();
			
			gameLoopId = requestAnimationFrame(gameLoop);
		}
		
		function handlePlayClick() {
		  navigateTo('/matchmaking/');
		}
		function onLoad() {
			// if (!initCanvas()) {
			// 	console.error('Failed to initialize canvas');
			// 	return;
			// }
			
			// // Reset ball position
			// ball.x = canvas.width / 2;
			// ball.y = canvas.height / 2;
			// ball.dx = 5;
			// ball.dy = 5;
			
			// // Reset paddle positions
			// leftPaddle.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
			// rightPaddle.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
			// rightPaddle.x = canvas.width - 25 - PADDLE_WIDTH;
			
			// // Start the game loop
			// gameLoop();
			
			// // Initialize play button
			// const playButton = document.getElementById('play_button');
			// if (playButton) {
			// 	playButton.addEventListener('click', handlePlayClick);
			// }

			set1v1Button();
		}
		
		function onUnload() {
			// Stop the game loop if needed
			if (gameLoopId) {
				cancelAnimationFrame(gameLoopId);
				gameLoopId = null;
			}
			
			// Remove event listener
			const playButton = document.getElementById('play_button');
			if (playButton) {
				playButton.removeEventListener('click', handlePlayClick);
			}
			
			// Clear references
			canvas = null;
			ctx = null;
		}
		async function start_game() {
			const player1 = user.id;
			const player2 = 1;

			const csrftoken = getCookie('csrftoken');
			const response = await fetch('/api/pong/create_match/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrftoken,
				},
				body: JSON.stringify({
					player1: 2,
					player2: 1
				}),
				credentials: 'include',
			})
			if (response.ok) {
				const match = await response.json();
				alert('Match créé avec succès !');
				console.log(match);
				console.log(match.id);
				window.sendNotification(1,match.id, 'match_request');
				navigateTo('/pong/' + match.id);
			} else {
				const result = await response.json();
				alert(result.detail || 'failed');
			}
		}

	function set1v1Button() {
		const matchButton = document.createElement('button');
		matchButton.textContent = 'Proposer un 1v1';
		matchButton.addEventListener('click', start_game);
		document.getElementById('1v1').appendChild(matchButton);
	}
	export { onLoad, onUnload };