import { calculateWinLossRatio, formatTimeAgo } from './utils.js';
import { renderFriendActions } from './friendActions.js';
import { set1v1Button } from './gameActions.js';

/**
 * Affiche les informations du profil d'un utilisateur
 * @param {Object} user - Données de l'utilisateur
 * @param {string} selectedGame - Type de jeu sélectionné 
 */
export function renderProfileInfo(user, selectedGame) {
	const profileUsername = document.getElementById('profile-username');
	const profileAvatar = document.getElementById('profile-avatar');
	const winLossRatio = document.getElementById('win-loss-ratio');
	const profileScore = document.getElementById('profile-score');
	const lastConnection = document.getElementById('last-connection');
	const rank = document.getElementById('rank');
	
    profileUsername.textContent = user.username;
    profileAvatar.src = user.avatar;
	if (selectedGame == "pong"){
		winLossRatio.textContent = calculateWinLossRatio(user.wins.pong, user.losses.pong); 
    	profileScore.textContent = user.scores.pong;
	}
	else
	{
		profileScore.textContent = user.scores.tictactoe;
		winLossRatio.textContent = calculateWinLossRatio(user.wins.tictactoe, user.losses.tictactoe); 
	}
    lastConnection.textContent = formatTimeAgo(user.last_connection);
	rank.textContent = user.rank;
	
    // Si ce n'est pas le profil de l'utilisateur connecté, ajouter les actions d'amitié
	if (user.id != window.user.id) {
    	renderFriendActions(user);
    }
    
    // Ajouter le bouton 1v1 si nécessaire
	set1v1Button(user, selectedGame);
} 