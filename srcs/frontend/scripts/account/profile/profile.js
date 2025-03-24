import { loadScript } from './utils.js';
import { renderProfileInfo } from './profileInfo.js';
import { fetchMatchesData } from './matchHistory.js';

// Variables globales
const selectedGame = localStorage.getItem('selectedGame');
let userData = null;

/**
 * Récupère les données du profil d'un utilisateur
 * @param {string} username - Nom d'utilisateur
 */
async function fetchProfileData(username) {
	try {
		const response = await fetch(`/api/account/profile/${username}/`);
        if (response.ok) {
			userData = await response.json();
            renderProfileInfo(userData, selectedGame);
            fetchMatchesData(userData, selectedGame);
        } else {
			alert('<h1>Utilisateur non trouvé</h1>');
        }
    } catch (error) {
		console.error('Erreur lors de la récupération des données du profil :', error);
        alert('<h1>Erreur lors du chargement du profil</h1>');
    }
}

function set1v1Button(user) {

	if (user.is_online && user.id !== window.user.id) {
		const button = document.createElement('button');
		button.classList.add('button', 'btn-primary', 'fight');
		button.innerHTML = '<i class="fas fa-gamepad"></i> proposer un vs';
		button.title = 'Faire une partie';
		button.addEventListener('click', (event) => {
			event.preventDefault();
			handleFightAction(user.id);
		});
		document.getElementById('1v1').appendChild(button);
	}
}
async function handleFightAction(userId) {
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
				game_type: selectedGame,
			}),
		});
		if (response.ok) {
			const data = await response.json();
		}
	} catch (error) {
		console.error('Erreur AJAX :', error);
	}
}

function formatTimeAgo(timestamp) {
	const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now - then) / 1000);
	
    if (diffInSeconds < 60) {
		return 'en ligne'; 
    } else if (diffInSeconds < 3600) { // Moins d'une heure
        const minutes = Math.floor(diffInSeconds / 60);
        return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) { // Moins d'un jour
        const hours = Math.floor(diffInSeconds / 3600);
        return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
		const days = Math.floor(diffInSeconds / 86400);
        return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
}

function calculateWinLossRatio(wins, losses) {
	const totalMatches = wins + losses;
    if (totalMatches === 0) return 0; 
    return ((wins / totalMatches) * 100).toFixed(2); 
}

function createActionButton(user) {
    const button = document.createElement('button');

    if (user.is_friend) {
        button.classList.add('button', 'btn-danger', 'remove-friend');
        button.dataset.action = `/api/account/friend-requests/${user.id}/remove/`; 
        button.innerHTML = '<i class="fas fa-user-times"></i>';
		button.title = 'Retirer de mes amis';
    } else if (user.friend_request_sent) {
        button.classList.add('button', 'btn-danger', 'cancel-friend-request');
        button.dataset.action = `/api/account/friend-requests/${user.id}/cancel/`; 
        button.innerHTML = '<i class="fas fa-user-slash"></i>';
        button.title = 'Annuler la demande d\'ami';
    } else if (user.friend_request_received) {
        const acceptButton = document.createElement('button');
        acceptButton.classList.add('button', 'btn-success', 'accept-friend-request');
        acceptButton.dataset.action = `/api/account/friend-requests/${user.id}/accept/`;
        acceptButton.innerHTML = '<i class="fas fa-user-check"></i>';

        const rejectButton = document.createElement('button');
        rejectButton.classList.add('button', 'btn-danger', 'reject-friend-request');
        rejectButton.dataset.action = `/api/account/friend-requests/${user.id}/reject/`;
        rejectButton.innerHTML = '<i class="fas fa-user-times"></i>';

        acceptButton.addEventListener('click', (event) => {
            event.preventDefault();
            handleFriendAction(acceptButton.dataset.action, user.id);
        });

        rejectButton.addEventListener('click', (event) => {
            event.preventDefault();
            handleFriendAction(rejectButton.dataset.action, user.id);
        });

        const buttonContainer = document.createElement('div');
		buttonContainer.id = "accept_refuse"
        buttonContainer.appendChild(acceptButton);
        buttonContainer.appendChild(rejectButton);

        return buttonContainer;
    } else if (user.id != window.user.id){
        button.classList.add('button', 'btn-primary', 'send-friend-request');
        button.dataset.action = `/api/account/friend-requests/${user.id}/send/`; 
        button.innerHTML = '<i class="fas fa-user-plus"></i>';
		button.title = 'Ajouter en ami';
    }

    if (!user.friend_request_received) {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            handleFriendAction(button.dataset.action, user.id);
        });
    }
	const buttonContainer = document.createElement('div');
	buttonContainer.appendChild(button);
    return buttonContainer; 
}

function renderFriendActions(user) {
	const friendActions = document.getElementById('friend-actions');
	friendActions.append(createActionButton(user))
}

async function handleFriendAction(actionUrl, userId) {
	try {
		const response = await fetch(actionUrl, {
			method: 'POST', 
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
			},
		});
		if (response.ok) {
			const data = await response.json();
			alert(data.success, "success");
			navigateTo(window.location.pathname);
		} else {
			const errorData = await response.json();
			alert('Erreur : ' + errorData.error, "error");
		}
	} catch (error) {
		alert('Erreur : ' + error, "error");
	}
}

/**
 * Fonction appelée au chargement de la page
 */
function onLoad() {
	loadScript('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js',   
	function() {
		const username = window.location.pathname.split('/').pop();
		fetchProfileData(username); 
	});
}

export { onLoad };