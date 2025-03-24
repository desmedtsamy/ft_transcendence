import { getCookie } from './utils.js';

/**
 * Configure le bouton de demande de partie 1v1
 * @param {Object} user - Données de l'utilisateur à défier
 */
export function set1v1Button(user, selectedGame) {
	if (user.is_online && user.id !== window.user.id) {
		const button = document.createElement('button');
		button.classList.add('button', 'btn-primary', 'fight');
		button.innerHTML = '<i class="fas fa-gamepad"></i> proposer un vs';
		button.title = 'Faire une partie';
		button.addEventListener('click', (event) => {
			event.preventDefault();
			handleFightAction(user.id, selectedGame);
		});
		document.getElementById('1v1').appendChild(button);
	}
}

/**
 * Envoie une demande de match à un autre joueur
 * @param {number} userId - ID de l'utilisateur à défier
 * @param {string} gameType - Type de jeu (pong, tictactoe, etc.)
 */
export async function handleFightAction(userId, gameType) {
	try {
		const response = await fetch(`/api/game/create_match/`, {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				player1: window.user.id,
				player2: userId,
				game_type: gameType,
			}),
		});
		if (response.ok) {
			const data = await response.json();
            // Notification que la demande a été envoyée
            alert('Invitation de match envoyée!', 'success');
		}
	} catch (error) {
		console.error('Erreur AJAX :', error);
        alert('Erreur lors de l\'envoi de l\'invitation', 'error');
	}
} 