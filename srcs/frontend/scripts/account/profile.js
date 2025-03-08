let scoreChart; 
let userData = null;
async function fetchProfileData(username) {
	try {
		const response = await fetch(`/api/account/profile/${username}/`);
        if (response.ok) {
			userData = await response.json();
            renderProfileInfo(userData);
            fetchMatchesData(username);
        } else {
			alert('<h1>Utilisateur non trouvé</h1>');
        }
    } catch (error) {
		console.error('Erreur lors de la récupération des données du profil :', error);
        alert('<h1>Erreur lors du chargement du profil</h1>');
    }
}

function set1v1Button(user) {

	if (user.is_online) {
		const matchButton = document.createElement('button');
		matchButton.textContent = 'Proposer un 1v1';
		matchButton.addEventListener('click', createMatch);
		document.getElementById('1v1').appendChild(matchButton);
	}
}

function renderProfileInfo(user) {
	const profileUsername = document.getElementById('profile-username');
	const profileAvatar = document.getElementById('profile-avatar');
	const winLossRatio = document.getElementById('win-loss-ratio');
	const profileScore = document.getElementById('profile-score');
	const lastConnection = document.getElementById('last-connection');
	
    profileUsername.textContent = user.username;
    profileAvatar.src = user.avatar;
    // winLossRatio.textContent = calculateWinLossRatio(user.wins, user.losses); 
    profileScore.textContent = user.score;
    lastConnection.textContent = formatTimeAgo(user.last_connection);
    renderFriendActions(user);
	set1v1Button(user);
}

function formatTimeAgo(timestamp) {
	const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now - then) / 1000);
	
    if (diffInSeconds < 60) {
		return 'il y a quelques secondes'; 
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

function renderFriendActions(user) {
	const friendActions = document.getElementById('friend-actions');
	friendActions.innerHTML = ''; // Clear previous actions
	
    if (user.id !== window.user.id) { 
		if (user.is_friend) {
			const removeFriendButton = createButton('Supprimer de la liste d\'amis', 'btn-danger', 'remove-friend', `/api/account/friends/${user.id}/remove/`);
            friendActions.appendChild(removeFriendButton);
        } else if (user.friend_request_sent) {
			const cancelRequestButton = createButton('Annuler la demande', 'btn-danger', 'cancel-friend-request', `/api/account/friend-requests/${user.id}/cancel/`);
            friendActions.appendChild(cancelRequestButton);
        } else if (user.friend_request_received) {
			const acceptButton = createButton('Accepter la demande', 'btn-success', 'accept-friend-request', `/api/account/friend-requests/${user.id}/accept/`);
            const rejectButton = createButton('Refuser la demande', 'btn-danger', 'reject-friend-request', `/api/account/friend-requests/${user.id}/reject/`);
            friendActions.appendChild(acceptButton);
            friendActions.appendChild(rejectButton);
        } else {
			const sendRequestButton = createButton('Envoyer une demande d\'ami', 'btn-primary', 'send-friend-request', `/api/account/friend-requests/${user.id}/send/`);
            friendActions.appendChild(sendRequestButton);
        }
    }
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
			console.log(data)
			alert(data.success, "success");
			searchUsers(); 
		} else {
			const errorData = await response.json();
			alert('Erreur : ' + errorData.error, "error");
		}
	} catch (error) {
		alert('Erreur : ' + error, "error");
	}
}

function createButton(text, colorClass, actionClass, actionUrl) {
	const button = document.createElement('button');
    button.classList.add('btn', colorClass, actionClass);
    button.dataset.action = actionUrl;
    button.textContent = text;
    button.addEventListener('click', (event) => {
		event.preventDefault();
        handleFriendAction(actionUrl, user.id);
    });
    return button;
}

async function fetchMatchesData(username) {
	try {
		const response = await fetch(`/api/account/matches/${username}/`); 
        if (response.ok) {
			const matchesData = await response.json();
			console.log(matchesData)
			renderRecentMatches(matchesData);
            //renderScoreChart(matchesData); 
        } else {
			console.error('Erreur lors de la récupération de l\'historique des matchs :', response.statusText);
        }
    } catch (error) {
		console.error('Erreur lors de la requête pour l\'historique des matchs :', error);
    }
}

function renderRecentMatches(matches) {
	const recentMatchesList = document.getElementById('recent-matches');
	recentMatchesList.innerHTML = '';
	
    if (matches.length === 0) {
		recentMatchesList.innerHTML = '<p>Aucun match récent.</p>';
        return;
    }

    matches.forEach(match => {
        const player1 = match.player1;
        const player2 = match.player2;

        console.log(`Player 1: ${player1}, Player 2: ${player2}`);
        
        const listItem = document.createElement('li');
        listItem.classList.add('match-item');

        // Date du match
        const matchDate = new Date(match.created_at);
        const formattedDate = matchDate.toLocaleString(); // Formater la date selon les préférences locales
        const dateDiv = document.createElement('div');
        dateDiv.classList.add('match-date');
        dateDiv.textContent = formattedDate;
        listItem.appendChild(dateDiv);

        // Joueurs et scores
        const playersDiv = document.createElement('div');
        playersDiv.classList.add('match-players');

        const player1Div = document.createElement('div');
        player1Div.classList.add('player');

        const player1Link = document.createElement('a');
		player1Link.href = `#`;
		player1Link.dataset.link = `/profile/${player1.id}`;
        player1Link.textContent = player1.username;
        player1Div.appendChild(player1Link);

        const scoreChangeSpan1 = document.createElement('span');
        scoreChangeSpan1.classList.add('score-change');
        player1Div.appendChild(scoreChangeSpan1);

        playersDiv.appendChild(player1Div);

        const versusDiv = document.createElement('div');
        versusDiv.classList.add('versus');
        versusDiv.textContent = 'VS';
        playersDiv.appendChild(versusDiv);

        const player2Div = document.createElement('div');
        player2Div.classList.add('player');

        const player2Link = document.createElement('a');
		player2Link.href = `#`;
		player2Link.dataset.link = `/profile/${player2.id}`;
        player2Link.textContent = player2.username;
        player2Div.appendChild(player2Link);

        const scoreChangeSpan2 = document.createElement('span');
        scoreChangeSpan2.classList.add('score-change');
        
        player2Div.appendChild(scoreChangeSpan2);

        playersDiv.appendChild(player2Div);

        listItem.appendChild(playersDiv);
        recentMatchesList.appendChild(listItem);
    });
}


function renderScoreChart(matches) {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    let currentScore = window.user.score; // On part du score actuel de l'utilisateur
    const scoreData = [currentScore];
    const labels = ['Score actuel'];

	if (scoreChart) {
        scoreChart.destroy();
    }

    for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const pointsChange = (match.winner && match.winner.id === window.user.id) ? match.points_at_stake : -match.points_at_stake;
        currentScore -= pointsChange; // On soustrait le changement de score pour revenir en arrière
        scoreData.push(currentScore);
        const matchDate = new Date(match.created_at);
        const formattedDate = matchDate.toLocaleString(); 
        labels.push(formattedDate);
    }

    // Inverser les tableaux pour avoir l'ordre chronologique
    scoreData.reverse();
    labels.reverse();

    scoreChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score',
                data: scoreData,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function loadScript(src, callback) {
    var script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    document.head.appendChild(script);
}

async function createMatch() {
	const player1 = user.id;
	const player2 = userData.id;

	// const csrftoken = getCookie('csrftoken');
	// const response = await fetch('/api/pong/create_match/', {
	// 	method: 'POST',
	// 	headers: {
	// 		'Content-Type': 'application/x-www-form-urlencoded',
	// 		'X-CSRFToken': csrftoken,
	// 	},
	// 	body: `player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`,
	// 	credentials: 'include',
	// })
	// if (response.ok) {
	// 	const match = await response.json();
	// 	alert('Match créé avec succès !');
	// 	navigateTo('/pong/' + match.id);
	// } else {
	// 	const result = await response.json();
	// 	alert(result.detail || 'failed');
	// }
	window.sendNotification(player2, 'match_request');
}


function onLoad(){
	loadScript('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js',   
	function() {
		const username = window.location.pathname.split('/').pop();
		fetchProfileData(username); 
	});
	// const username = window.location.pathname.split('/').pop();
	// fetchProfileData(username);
}

export {onLoad, createMatch};
window.createMatch = createMatch;