import { getCookie } from './utils.js';

/**
 * Crée un bouton d'action pour les relations d'amitié
 * @param {Object} user - Données de l'utilisateur
 * @returns {HTMLElement} - Conteneur avec le(s) bouton(s)
 */
export function createActionButton(user) {
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

/**
 * Ajoute les boutons d'action d'amitié au profil
 * @param {Object} user - Données de l'utilisateur
 */
export function renderFriendActions(user) {
	const friendActions = document.getElementById('friend-actions');
	friendActions.append(createActionButton(user))
}

/**
 * Gère les actions d'amitié (ajouter, supprimer, accepter, refuser)
 * @param {string} actionUrl - URL de l'API pour l'action
 * @param {number} userId - ID de l'utilisateur concerné
 */
export async function handleFriendAction(actionUrl, userId) {
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