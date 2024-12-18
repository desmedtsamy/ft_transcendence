function searchUsers() {
	const query = document.getElementById('query').value;
	fetch('/api/account/search/?query=' + query) 
		.then(response => {
			if (!response.ok) {
				throw new Error('Erreur lors de la requête : ' + response.status);
			}
			return response.json();
		})
		.then(data => {
			renderSearchResults(data);
		})
		.catch(error => {
			console.error('Erreur AJAX :', error);
		});
}

function renderSearchResults(users) {
	const searchResults = document.getElementById('search-results');
	searchResults.innerHTML = '';

	if (users.length === 0) {
		searchResults.innerHTML = '<img src="/img/travolta.png" alt="Aucun résultat">';
		searchResults.innerHTML += "<p>Aucun résultat pour <strong>"+ document.getElementById('query').value +'</strong></p>';
		return;
	}

	for (const user of users) {
		const listItem = document.createElement('li');
		listItem.classList.add('user_element');
		listItem.dataset.userId = user.id;

		const link = document.createElement('a');
        link.href = `#`;
        link.dataset.link = `/profile/${user.username}`;

		const avatarContainer = document.createElement('div');
		avatarContainer.classList.add('avatar-container');

		const avatarImg = document.createElement('img');
		avatarImg.classList.add('avatar');
		avatarImg.src = user.avatar;
		avatarImg.alt = `Avatar de ${user.username}`;
		avatarContainer.appendChild(avatarImg);

		const statusSpan = document.createElement('span');
		statusSpan.classList.add(user.is_online ? 'online-status' : 'offline-status');
		const statusIcon = document.createElement('i');
		statusSpan.appendChild(statusIcon);
		avatarContainer.appendChild(statusSpan);

		link.appendChild(avatarContainer);
		link.appendChild(document.createTextNode(user.username));

		listItem.appendChild(link);

		// Ajouter les boutons d'action en fonction de la relation avec l'utilisateur
		const actionButton = createActionButton(user);
		listItem.appendChild(actionButton);

		searchResults.appendChild(listItem);
	}
}
function createActionButton(user) {
    const button = document.createElement('button');

    if (user.is_friend) {
        button.classList.add('button', 'btn-danger', 'remove-friend');
        button.dataset.action = `/api/account/friends/${user.id}/remove/`; 
        button.innerHTML = '<i class="fas fa-user-times"></i>';
		button.title = 'Retirer de mes amis';
    } else if (user.friend_request_sent) {
        button.classList.add('button', 'btn-danger', 'cancel-friend-request');
        button.dataset.action = `/api/account/friend-requests/${user.id}/cancel/`; 
        button.textContent = 'Annuler';
		button.title = 'Annuler la demande d\'ami';
    } else if (user.friend_request_received) {
        const acceptButton = document.createElement('button');
        acceptButton.classList.add('button', 'btn-success', 'accept-friend-request');
        acceptButton.dataset.action = `/api/account/friend-requests/${user.id}/accept/`; // URL pour accepter
        acceptButton.textContent = 'Accepter';

        const rejectButton = document.createElement('button');
        rejectButton.classList.add('button', 'btn-danger', 'reject-friend-request');
        rejectButton.dataset.action = `/api/account/friend-requests/${user.id}/reject/`; // URL pour refuser
        rejectButton.textContent = 'Refuser';

        acceptButton.addEventListener('click', (event) => {
            event.preventDefault();
            handleFriendAction(acceptButton.dataset.action, user.id);
        });

        rejectButton.addEventListener('click', (event) => {
            event.preventDefault();
            handleFriendAction(rejectButton.dataset.action, user.id);
        });

        const buttonContainer = document.createElement('div');
        buttonContainer.appendChild(acceptButton);
        buttonContainer.appendChild(rejectButton);

        return buttonContainer;
    } else {
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

    return button; 
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
			searchUsers(); 
		} else {
			const errorData = await response.json();
			alert('Erreur : ' + errorData.error, "error");
			console.log('Erreur : ' + errorData.error);
		}
	} catch (error) {
		console.error('Erreur lors de la requête :', error);
		alert('Erreur : ' + errorData.error, "error");
	}
}

function onLoad() {
	searchUsers();
}
export { onLoad, searchUsers };
window.searchUsers = searchUsers;