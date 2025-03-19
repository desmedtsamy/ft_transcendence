const selectedGame = localStorage.getItem('selectedGame');
let scoreChart; 
let userData = null;

async function fetchProfileData(username) {
	try {
		const response = await fetch(`/api/account/profile/${username}/`);
        if (response.ok) {
			userData = await response.json();
            renderProfileInfo(userData);
            fetchMatchesData(userData);
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

function renderProfileInfo(user) {
	const profileUsername = document.getElementById('profile-username');
	const profileAvatar = document.getElementById('profile-avatar');
	const winLossRatio = document.getElementById('win-loss-ratio');
	const profileScore = document.getElementById('profile-score');
	const lastConnection = document.getElementById('last-connection');
	
    profileUsername.textContent = user.username;
    profileAvatar.src = user.avatar;
    winLossRatio.textContent = calculateWinLossRatio(user.wins, user.losses); 
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
			const removeFriendButton = createButton('Supprimer de la liste d\'amis', 'btn-danger', 'remove-friend', `/api/account/friend-requests/${user.id}/remove/`);
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

async function fetchMatchesData(userData) {
	try {
		const response = await fetch(`/api/account/matches/${userData.id}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'),
			},
			body: JSON.stringify({ selectedGame })
		}); 
        if (response.ok) {
			const matchesData = await response.json();
			renderRecentMatches(matchesData, userData);
            renderScoreChart(matchesData, userData); 
        } else {
			console.error('Erreur lors de la récupération de l\'historique des matchs :', response.statusText);
        }
    } catch (error) {
		console.error('Erreur lors de la requête pour l\'historique des matchs :', error);
    }
}

function renderRecentMatches(matches, userData) {
	const recentMatchesList = document.getElementById('recent-matches');
	recentMatchesList.innerHTML = '';
	
    if (matches.length === 0) {
		recentMatchesList.innerHTML = '<p>Aucun match récent.</p>';
        return;
    }
    matches.forEach(match => {
        let player1 = match.player1;
        let player2 = match.player2;
		if (player1 == null) {
			player1 = {username: 'anonyme', id: null};
		}
		if (player2 == null) {
			player2 = {username: 'anonyme', id: null};
		}
		if (player2.id == userData.id) {
			player1 = match.player2;
			player2 = match.player1;
		}
        
        const listItem = document.createElement('li');
        listItem.classList.add('match-item');

        // Joueurs et scores dans une seule ligne
        const matchInfoDiv = document.createElement('div');
        matchInfoDiv.classList.add('match-info');

        // Joueur 1
        const player1Span = document.createElement('span');
        player1Span.classList.add('player-name');
        
		player1Span.textContent = player1.username;
		console.log(match.winner, player1.id);
		console.log(match)
		if (match.winner && player1.id == match.winner) {
			player1Span.classList.add('winner');
		} else {
			player1Span.classList.add('loser');
		}
		matchInfoDiv.appendChild(player1Span);
        // Versus
        const versusSpan = document.createElement('span');
        versusSpan.classList.add('versus');
        versusSpan.textContent = ' vs ';
        matchInfoDiv.appendChild(versusSpan);
        
        // Joueur 2
        const player2Span = document.createElement('span');
        player2Span.classList.add('player-name');
        
        if(player2.id) {
			if (match.winner && player2.id == match.winner) {
				player2Span.classList.add('winner');
			} else {
				player2Span.classList.add('loser');
			}
            const player2Link = document.createElement('a');
            player2Link.href = '#';
            player2Link.dataset.link = `/profile/${player2.username}`;
            player2Link.textContent = player2.username;
            player2Span.appendChild(player2Link);
        } else {
            player2Span.textContent = player2.username;
        }
        matchInfoDiv.appendChild(player2Span);
        
        
        listItem.appendChild(matchInfoDiv);
        recentMatchesList.appendChild(listItem);
    });
}


function renderScoreChart(matches, user) {
    const ctx = document.getElementById('scoreChart').getContext('2d');

    let currentScore = user.scores[user.selected_game];
    const scoreData = [currentScore];
    const labels = ['Score actuel'];

    if (scoreChart) {
        scoreChart.destroy();
    }
    
    for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const isWinner = match.winner && match.winner === user.id;
        
        const pointsChange = isWinner ? 42 : -21;
        
        // Calcul du score historique
        currentScore -= pointsChange;
        scoreData.push(currentScore);
        
        // Formatage de la date
        const matchDate = new Date(match.created_at);
        const formattedDate = matchDate.toLocaleString(); 
        labels.push(formattedDate);
    }
    
    console.log("Scores calculés:", scoreData);
    
    // Inverser les tableaux pour avoir l'ordre chronologique
    scoreData.reverse();
    labels.reverse();

    // Get the primary color from CSS variables
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();
    const secondaryBg = getComputedStyle(document.documentElement).getPropertyValue('--secondary-bg').trim();

    scoreChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score',
                data: scoreData,
                borderColor: primaryColor,
                backgroundColor: 'rgba(22, 224, 189, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: primaryColor,
                pointBorderColor: primaryColor,
                pointHoverBackgroundColor: bgColor,
                pointHoverBorderColor: primaryColor,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: primaryColor
                    },
                    onClick: null
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(22, 224, 189, 0.1)'
                    },
                    ticks: {
                        color: primaryColor
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(22, 224, 189, 0.1)'
                    },
                    ticks: {
                        color: primaryColor
                    }
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

function onLoad(){
	loadScript('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js',   
	function() {
		const username = window.location.pathname.split('/').pop();
		fetchProfileData(username); 
	});
}

export {onLoad};