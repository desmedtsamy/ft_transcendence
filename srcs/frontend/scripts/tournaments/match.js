export function populateTournaments(tournamentId)
{
	const tournamentList = document.getElementById('tournament-list');
	if (!tournamentList) {
		console.warn('Tournament list element not found, waiting for DOM...');
		setTimeout(() => populateTournaments(tournamentId), 100);
		return;
	}

	// Get selected game with fallback to 'pong'
	const selectedGame = localStorage.getItem('selectedGame') || 'pong';

    fetch('/api/tournament/getTournaments/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
			'X-CSRFToken': getCookie('csrftoken'),
        },
        credentials: 'include', // Add this to ensure cookies are sent
        body: JSON.stringify({ selectedGame })
    })
	.then(response => {
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return response.json();
	})
	.then(data => {
		if (!tournamentList) {
			console.error('Tournament list element not found after fetch');
			return;
		}
		tournamentList.innerHTML = '';
		if (!data.tournaments || data.tournaments.length === 0) {
			tournamentList.innerHTML = '<div class="text-center mt-3" style="color: var(--primary-color)">Aucun tournoi disponible</div>';
			return;
		}
		data["tournaments"].forEach(tournament => {
			const tournamentEl = document.createElement('div');
			tournamentEl.className = 'tournament-item';
			
			const infoDiv = document.createElement('div');
			infoDiv.className = 'tournament-info';
			
			const nameDiv = document.createElement('div');
			nameDiv.className = 'tournament-name';
			nameDiv.textContent = tournament.name;
			
			const playersDiv = document.createElement('div');
			playersDiv.className = 'tournament-players';
			playersDiv.textContent = `${tournament.players_count}/${tournament.number_of_players} joueurs`;
			
			const statusDiv = document.createElement('div');
			statusDiv.className = `tournament-status ${getStatusClass(tournament)}`;
			
			infoDiv.appendChild(nameDiv);
			infoDiv.appendChild(playersDiv);
			tournamentEl.appendChild(infoDiv);
			tournamentEl.appendChild(statusDiv);
			
			tournamentEl.dataset.tournamentId = tournament.id;
			tournamentEl.onclick = function() {
				selectTournament(tournamentEl);
			}
			if (tournamentId && tournamentId === tournament.id) {
				selectTournament(tournamentEl);
			}
			tournamentList.appendChild(tournamentEl);
		});
	})
	.catch(error => {
		console.error('Error fetching tournaments:', error);
		tournamentList.innerHTML = '<div class="text-center mt-3 text-danger">Erreur lors du chargement des tournois</div>';
	});
}

function getStatusClass(tournament) {
	if (tournament.is_finished) return 'status-finished';
	if (tournament.is_started) return 'status-active';
	return 'status-pending';
}

function selectTournament(element) {
	const newUrl = `/tournaments/${element.dataset.tournamentId}`;
	window.history.pushState({}, '', newUrl);
	document.querySelectorAll('.tournament-item.selected').forEach(item => {
		item.classList.remove('selected');
	});	
	
	element.classList.add('selected');
	const tournamentId = element.dataset.tournamentId;
	fetch(`/api/tournament/${tournamentId}/`)
	.then(response => {
		if (!response.ok) {
			throw new Error('Erreur lors de la récupération du tournoi');
		}
		return response.json();
	})
	.then(data => {	
		window.activeTournament = data;
		document.getElementById('tournament_name').textContent = data.name;
		renderTournament(data);
	})
	.catch(error => {
		alert("le tournoi a été supprimé")
		navigateTo('/tournaments');
	});	
}	

function renderTournament(tournament) {
	document.getElementById('button_container').innerHTML = '';
	document.getElementById('admin_button_container').innerHTML = '';

	const tournamentEl = document.getElementById('tournament');
	if (!tournamentEl) {
		console.error('Tournament element not found');
		return;
	}
	
	tournamentEl.innerHTML = '';
	
	// Apply base styles to ensure visibility
	tournamentEl.style.backgroundColor = 'var(--secondary-bg)';
	tournamentEl.style.padding = '20px';
	tournamentEl.style.borderRadius = '8px';
	tournamentEl.style.border = '1px solid var(--primary-color)';
	
	if (tournament.rounds && tournament.rounds.length > 0) {
		tournament.rounds.forEach((round, index) => {
			const roundEl = document.createElement('div');
			roundEl.className = 'round';
			roundEl.style.marginRight = '20px'; // Add spacing between rounds
			
			if (round.matches && round.matches.length > 0) {
				round.matches.forEach(match => {
					roundEl.appendChild(createMatchElement(match));
				});
			} else {
				roundEl.innerHTML = '<div class="text-center">En attente des matchs...</div>';
			}
			
			tournamentEl.appendChild(roundEl);
		});
		
		if (tournament.is_finished) {
			tournamentEl.appendChild(createWinnerElement(tournament));
		}
	} else {
		tournamentEl.innerHTML = '<div class="text-center p-4">En attente de joueurs...</div>';
	}

	// Add buttons based on tournament state
	if (!tournament.is_started && window.user) {
		if (tournament.players && tournament.players.includes(window.user.username)) {
			document.getElementById('button_container').appendChild(createButton('Quitter le tournoi', leaveTournament));
		} else {
			document.getElementById('button_container').appendChild(createButton('Rejoindre le tournoi', joinTournament));
		}
	}

	// Admin buttons
	if (window.user && tournament.creator === window.user.username) {
		if (!tournament.is_started || tournament.is_finished) {
			document.getElementById('admin_button_container').appendChild(createButton('Supprimer le tournoi', deleteTournament));
		}
	}
}

function createMatchElement(match) {
	const matchEl = document.createElement('div');
	matchEl.className = 'match';
	
	// Si le match est terminé et qu'un joueur est manquant, on le remplace par "anonyme"
	let player1 = match.player1;
	let player2 = match.player2;
	
	if (match.status == "finished") {
		if (player1 == null) player1 = "anonyme";
		if (player2 == null) player2 = "anonyme";
	}
	
	let player1El = createPlayerElement(player1);
	let player2El = createPlayerElement(player2);
	
	if (match.status == "finished") {
		if (match.winner === match.player1) {
			player1El.classList.add('win');
			player2El.classList.add('looser');
		} else {
			player1El.classList.add('looser');
			player2El.classList.add('win');
		}
	}
	
	matchEl.appendChild(player1El);
	matchEl.appendChild(player2El);
	return matchEl;
}

function createPlayerElement(player) {
	const playerEl = document.createElement('div');
	playerEl.className = 'player';
	const nameEl = document.createElement('span');
	if (player != null) {
		nameEl.textContent = player;
	} else {
		nameEl.textContent = "";
	}
	playerEl.appendChild(nameEl);
	return playerEl;
}

function createWinnerElement(tournament) {
	const roundEl = document.createElement('div');
	roundEl.className = 'round';
	const matchEl = document.createElement('div');
	matchEl.className = 'match';
	const winnerEl = document.createElement('div');
	winnerEl.className = 'player';
	winnerEl.classList.add('winner');
	winnerEl.textContent = tournament.winner ? tournament.winner : "anonyme";
	matchEl.appendChild(winnerEl);
	roundEl.appendChild(matchEl);
	return roundEl;
}

function createButton(text, onClick) {
	const button = document.createElement('button');
	button.className = 'btn btn-primary mx-1';
	button.textContent = text;
	button.onclick = onClick;
	return button;
}

async function deleteTournament(){
	if (!window.activeTournament)
	{
		alert('Aucun tournois selectionné');
		return;
	}
	try {
		const response = await fetch('/api/tournament/delete_tournament/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'),
			},
			body: JSON.stringify({tournamentId: window.activeTournament.id}),
		});
		
		if (response.ok) {
			alert('Tournois supprimé avec succès !');
			navigateTo('/tournaments/');
		} else {
			const errorData = await response.json();
			alert('imposible de supprimé le tournois : ' + errorData.error);
		}
	} catch (error) {
		console.error('Erreur lors de la requête :', error);
		alert('Une erreur est survenue. Veuillez réessayer plus tard.');
		navigateTo('/tournaments');
	}
}

// Make functions available globally
window.populateTournaments = populateTournaments;
window.selectTournament = selectTournament;
window.renderTournament = renderTournament;
window.createMatchElement = createMatchElement;
window.createPlayerElement = createPlayerElement;
window.createButton = createButton;
window.deleteTournament = deleteTournament;
window.createWinnerElement = createWinnerElement;