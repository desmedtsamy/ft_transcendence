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
    renderFriendActions(user);
	set1v1Button(user);
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
			console.log(matchesData)
			// Afficher l'en-tête approprié en fonction du type de jeu
			updateMatchesHeader(selectedGame);
			renderRecentMatches(matchesData, userData);
            renderScoreChart(matchesData, userData); 
        } else {
			console.error('Erreur lors de la récupération de l\'historique des matchs :', response.statusText);
        }
    } catch (error) {
		console.error('Erreur lors de la requête pour l\'historique des matchs :', error);
    }
}

/**
 * Affiche l'en-tête approprié en fonction du type de jeu sélectionné
 */
function updateMatchesHeader(gameType) {
	const pongHeader = document.getElementById('matches-header-pong');
	const tictactoeHeader = document.getElementById('matches-header-tictactoe');
	
	if (gameType === 'pong') {
		pongHeader.style.display = '';
		tictactoeHeader.style.display = 'none';
	} else if (gameType === 'tictactoe') {
		pongHeader.style.display = 'none';
		tictactoeHeader.style.display = '';
	}
}

function renderRecentMatches(matches, userData) {
    const recentMatchesList = document.getElementById('recent-matches');
    recentMatchesList.innerHTML = '';

    if (matches.length === 0) {
        recentMatchesList.innerHTML = '<li class="empty-state">Aucun match récent</li>';
        return;
    }

    matches.forEach(match => {
        // Gestion des joueurs nuls
        let player1 = match.player1 ?? { username: 'anonyme', id: null };
        let player2 = match.player2 ?? { username: 'anonyme', id: null };

        // Échange si l'utilisateur est player2
        if (player2.id === userData.id) {
            [player1, player2] = [player2, player1];
            // Échange des scores seulement pour Pong
            if (match.game_type === 'pong' && match.data && match.data.scores) {
                [match.data.scores[1], match.data.scores[2]] = [match.data.scores[2], match.data.scores[1]];
            }
        }

        // Création des éléments DOM
        const listItem = document.createElement('li');
        listItem.classList.add('match-item');

        // Colonne 1: Joueurs
        const playersDiv = document.createElement('div');
        playersDiv.classList.add('match-players');

        // Joueur 1
        const player1Span = document.createElement('span');
        player1Span.classList.add('player-name');
        if (player1.id) {
            const player1Link = document.createElement('span');
            player1Link.textContent = player1.username;
            player1Span.appendChild(player1Link);
        } else {
            player1Span.textContent = player1.username;
        }

        // Séparateur VS
        const vsSpan = document.createElement('span');
        vsSpan.classList.add('vs-separator');
        vsSpan.textContent = 'vs';

        // Joueur 2
        const player2Span = document.createElement('span');
        player2Span.classList.add('player-name');
        if (player2.id) {
            const player2Link = document.createElement('a');
            player2Link.href = `/profile/${player2.username}`;
            player2Link.textContent = player2.username;
            player2Span.appendChild(player2Link);
        } else {
            player2Span.textContent = player2.username;
        }

        playersDiv.append(player1Span, vsSpan, player2Span);

        // Colonne 2: Résultat
        const resultDiv = document.createElement('div');
        const userWon = match.winner && match.winner.id === userData.id;
        resultDiv.classList.add('match-result', userWon ? 'winner-badge' : (match.winner ? 'loser-badge' : 'draw-badge'));
        
        resultDiv.textContent = userWon ? 'Victoire' : 'Défaite';
        

        // Colonne 3 et 4: Données spécifiques au type de jeu
        const dataCol1 = document.createElement('div');
        const dataCol2 = document.createElement('div');

        if (match.game_type === 'pong') {
            // Pour Pong: Durée et Score
            dataCol1.textContent = match.data && match.data.duration ? 
                `${Math.floor(match.data.duration / 60)}m${match.data.duration % 60}s` : 
                'N/A';
            
            dataCol2.textContent = match.data && match.data.scores ? 
                `${match.data.scores[1]} / ${match.data.scores[2]}` : 
                'N/A';
        } else if (match.game_type === 'tictactoe') {
            // Pour Tic-tac-toe: Nombre de coups et Match nul
            dataCol1.textContent = match.data && match.data.moves ? 
                `${match.data.moves} coups` : 
                'N/A';
            
            dataCol2.textContent = match.data && match.data.draws !== undefined ? 
				match.data.draws : 'N/A';
        }

        // Assemblage des éléments
        listItem.append(
            playersDiv,
            resultDiv,
            dataCol1,
            dataCol2
        );

        // Ajout des classes de style pour les joueurs
        if (match.game_type === 'tictactoe' && match.data && match.data.draws === 1) {
            player1Span.classList.add('draw');
            player2Span.classList.add('draw');
        } else if (userWon) {
            player1Span.classList.add('winner');
            player2Span.classList.add('loser');
        } else {
            player1Span.classList.add('loser');
            player2Span.classList.add('winner');
        }

        recentMatchesList.appendChild(listItem);
    });
}


function renderScoreChart(matches, user) {
	console.log(matches)
    const ctx = document.getElementById('scoreChart').getContext('2d');

    // Calculate starting score by going backward from current score based on match history
    let startingScore = user.scores[user.selected_game];
    // Loop through matches from newest to oldest to get the starting score
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const isWinner = match.winner && match.winner === user.id;
        const pointsChange = isWinner ? 42 : -21;
        startingScore -= pointsChange; // Subtract the points that were gained/lost
    }
    
    // Make sure starting score isn't negative
    startingScore = Math.max(0, startingScore);
    
    // Now build the score data in forward chronological order (oldest match first)
    const scoreData = [startingScore];
    const labels = [''];
    
    let runningScore = startingScore;
    
    if (scoreChart) {
        scoreChart.destroy();
    }
    
    // Process matches in chronological order (oldest first)
    for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const isWinner = match.winner && match.winner === user.id;
        
        const pointsChange = isWinner ? 42 : -21;
        
        // Add points to running score
        runningScore += pointsChange;
        scoreData.push(runningScore);
        
        // Use numbered games
        labels.push(`Match ${matches.length - i}`);
    }
    
    // Current score is already the last element in scoreData
    // We just need to update the last label
    labels[labels.length - 1] = 'Actuel';
    
    // No need to reverse arrays as we're already building them in chronological order
    
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
                tension: 0.1
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
                        color: primaryColor,
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10
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