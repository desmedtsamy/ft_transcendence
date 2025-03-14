const selectedGame = localStorage.getItem('selectedGame');

function displayScoreboard(data) {
    const scoreboard = document.getElementById('scoreboard-body');
    scoreboard.innerHTML = '';
    let rank_value = 1;

    data.forEach((user) => {
        const row = document.createElement('tr');
        const rank = document.createElement('td');
        const avatar = document.createElement('img');
        const link = document.createElement('a');
        const name = document.createElement('td');
        const score = document.createElement('td');

        rank.textContent = rank_value++;
        rank.classList.add('text-center');
        avatar.src = user.avatar;
        avatar.alt = `Avatar de ${user.username}`;
        avatar.classList.add('avatar_scoreboard');
        link.href = `#`;
        link.dataset.link = `/profile/${user.username}`;
        const playerInfoContainer = document.createElement('div');
        playerInfoContainer.classList.add('player-info'); 

        const avatarContainer = document.createElement('div');
		avatarContainer.classList.add('avatar-container');
        avatarContainer.appendChild(avatar);

		if (window.friends && window.friends.some(friend => friend.id === user.id))
		{
			const statusSpan = document.createElement('span');
			statusSpan.classList.add(user.is_online ? 'online-status' : 'offline-status');
			const statusIcon = document.createElement('i');
			statusSpan.appendChild(statusIcon);
			avatarContainer.appendChild(statusSpan);
		}
		
		playerInfoContainer.appendChild(avatarContainer);
        const usernameSpan = document.createElement('span');
        usernameSpan.textContent = user.username;
        playerInfoContainer.appendChild(usernameSpan);
        link.appendChild(playerInfoContainer);


        name.appendChild(link);
        name.classList.add('text-center', 'cellule');
        score.textContent = user.scores[selectedGame];
        score.classList.add('text-center');

        row.appendChild(rank);
        row.appendChild(name);
        row.appendChild(score);
        scoreboard.appendChild(row);
    });
}

async function fetchScoreboardData() {

	try {
		const response = await fetch('/api/scoreboard/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'),
			},
			body: JSON.stringify({ selectedGame: selectedGame })
		});
		if (response.ok) {
			const data = await response.json();
			displayScoreboard(data['top_players']);
		} else {
			console.error('Failed to fetch scoreboard data');
		}
	} catch (error) {
		console.error('Error:', error);
	}
}

function onLoad() {
	fetchScoreboardData();
}

function onUnload() {
}

export { onLoad, onUnload };