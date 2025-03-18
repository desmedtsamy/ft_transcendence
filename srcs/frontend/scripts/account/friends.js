const selectedGame = localStorage.getItem('selectedGame');

function getFriendRequests() {
	fetch('/api/account/friend-requests/')
		.then(response => {
			if (!response.ok) {
				throw new Error('Erreur lors de la requête : ' + response.status);
			}
			return response.json();
		})
		.then(data => {
			renderFriendRequests(data);
		})
		.catch(error => {
			console.error('Erreur AJAX :', error);
		});
}

function renderFriendRequests(data) {
	const friendRequests = document.getElementById('friend-requests');
	friendRequests.innerHTML = '';
	if (data.length === 0)
		return;
	friendRequests.innerHTML = '<h2>demandes d\'amis</h2>';
	for (const user of data) {
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

		link.appendChild(avatarContainer);
		link.appendChild(document.createTextNode(user.username));

		listItem.appendChild(link);

		const div = document.createElement('div');

		const acceptFriendButton = createAcceptFriendButton(user);
		div.appendChild(acceptFriendButton);

		const rejectFriendButton = createRejectFriendButton(user);
		div.appendChild(rejectFriendButton);

		listItem.appendChild(div);

		friendRequests.appendChild(listItem);
	}
}

function createAcceptFriendButton(user) {
	const button = document.createElement('button');
	button.classList.add('button', 'btn-primary', 'accept-friend');
	button.innerHTML = '<i class="fas fa-user-check"></i>';
	button.title = 'Accepter';
	button.addEventListener('click', (event) => {
		event.preventDefault();
		handleAcceptFriendRequest(user.id);
		alert('demande d\'ami acceptée');
	});
	return button;
}

function createRejectFriendButton(user) {
	const button = document.createElement('button');
	button.classList.add('button', 'btn-danger', 'reject-friend');
	button.innerHTML = '<i class="fas fa-user-times"></i>';
	button.title = 'Rejeter';
	button.addEventListener('click', (event) => {
		event.preventDefault();
		handleRejectFriendRequest(user.id);
		alert('demande d\'ami rejetée');

	});
	return button;
}

function handleAcceptFriendRequest(userId) {
	fetch(`/api/account/friend-requests/${userId}/accept/`, {
		method: 'POST',
		headers: {
			'X-CSRFToken': getCookie('csrftoken'),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			user_id: userId,
		}),
	}).then(() => {
		onLoad();
	});
}

function handleRejectFriendRequest(userId) {
	fetch(`/api/account/friend-requests/${userId}/reject/`, {
		method: 'POST',
		headers: {
			'X-CSRFToken': getCookie('csrftoken'),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			user_id: userId,
		}),
	}).then(() => {
		onLoad();
	});
}

function renderSearchResults(users) {
	const searchResults = document.getElementById('search-results');
	searchResults.innerHTML = '';

	searchResults.innerHTML = '<h2>liste d\'amis</h2>';
	if (users.length === 0) {
		const emptyStateDiv = document.createElement('div');
		emptyStateDiv.classList.add('empty-state');
		
		const message = document.createElement('p');
		message.innerHTML = "Vous n'avez pas encore d'amis. Commencez à explorer et à vous connecter avec d'autres joueurs!";
		
		const searchLink = document.createElement('a');
		searchLink.href = '#';
		searchLink.dataset.link = '/search';
		searchLink.classList.add('button', 'btn-primary');
		searchLink.innerHTML = '<i class="fas fa-search"></i> Rechercher des joueurs';
		
		emptyStateDiv.appendChild(message);
		emptyStateDiv.appendChild(searchLink);
		searchResults.appendChild(emptyStateDiv);
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

		const div = document.createElement('div');

		const fightButton = createFightButton(user);
		div.appendChild(fightButton);

		const removeFriendButton = createRemoveFriendButton(user);
		div.appendChild(removeFriendButton);

		listItem.appendChild(div);

		searchResults.appendChild(listItem);
	}
	
	function createFightButton(user) {
		const button = document.createElement('button');
		button.classList.add('button', 'btn-primary', 'fight');
		button.innerHTML = '<i class="fas fa-gamepad"></i>';
		button.title = 'Faire une partie';
		button.addEventListener('click', (event) => {
			event.preventDefault();
			handleFightAction(user.id);
		});
		return button;
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
	} catch (error) {
		console.error('Erreur AJAX :', error);
	}
}

function createRemoveFriendButton(user) {
	const button = document.createElement('button');

	button.classList.add('button', 'btn-danger', 'remove-friend');
	button.dataset.action = `/api/account/friend-requests/${user.id}/remove/`;
	button.innerHTML = '<i class="fas fa-user-times"></i>';
	button.title = 'Retirer de mes amis';
	button.addEventListener('click', (event) => {
		event.preventDefault();
		handleRemoveFriend(user.id);
		alert('ami retiré');
	});
	return button;
}

function handleRemoveFriend(userId) {
	fetch(`/api/account/friend-requests/${userId}/remove/`, {
		method: 'POST',
		headers: {
			'X-CSRFToken': getCookie('csrftoken'),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			user_id: userId,
		}),
	}).then(() => {
		onLoad();
	});
}

function onLoad() {
	if (window.user === null) {
		return; // Don't try to load friend data if user is not authenticated
	}
	getFriendRequests();
	window.updateFriends().then(() => {
		renderSearchResults(window.friends);
	});
}
export { onLoad };