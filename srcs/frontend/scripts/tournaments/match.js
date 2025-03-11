function getStatusClass(tournament) {
	if (tournament.is_finished) return 'status-finished';
	if (tournament.is_started) return 'status-active';
	return 'status-pending';
}

export function populateTournaments(tournamentId)
{
	fetch('/api/tournament/getTournaments/')
	.then(response => {
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
		return response.json();
	})
	.then(data => {
		const tournamentList = document.getElementById('tournament-list');
		tournamentList.innerHTML = '';
		
		if (data && data.tournaments && Array.isArray(data.tournaments)) {
			data.tournaments.forEach(tournament => {
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
					document.querySelectorAll('.tournament-item').forEach(item => {
						item.classList.remove('selected');
					});
					tournamentEl.classList.add('selected');
					selectTournament(tournamentEl);
				}
				
				if (tournamentId && tournamentId === tournament.id) {
					tournamentEl.classList.add('selected');
					selectTournament(tournamentEl);
				}
				
				tournamentList.appendChild(tournamentEl);
			});
		} else {
			console.error('Invalid tournament data format:', data);
			tournamentList.innerHTML = '<div class="text-center p-3">Aucun tournoi disponible ou vous devez vous connecter.</div>';
		}
	})
	.catch(error => {
		console.error('Error fetching tournaments:', error);
		const tournamentList = document.getElementById('tournament-list');
		tournamentList.innerHTML = '<div class="text-center p-3">Erreur lors du chargement des tournois. Veuillez vous connecter ou réessayer plus tard.</div>';
	});
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
	.then(response => response.json())
	.then(data => {	
		window.activeTournament = data;
		document.getElementById('tournament_name').textContent = data.name;
		renderTournament(data);
	});	
}	

function renderTournament(tournament) {
	document.getElementById('button_container').innerHTML = '';
	document.getElementById('admin_button_container').innerHTML = '';

	const tournamentEl = document.getElementById('tournament');
	tournamentEl.innerHTML = '';
	
	tournament.rounds.forEach(round => {
		const roundEl = document.createElement('div');
		roundEl.className = 'round';
		round.matches.forEach(match => {
			roundEl.appendChild(createMatchElement(match));
		});
		tournamentEl.appendChild(roundEl);
	});
	tournamentEl.appendChild(createWinnerElement(tournament));
	if (!tournament.is_started)
		if (tournament.players.includes(user.username))
			document.getElementById('button_container').appendChild(createButton('quité le tournois', leaveTournament));
		else
			document.getElementById('button_container').appendChild(createButton('rejoindre le tournois', joinTournament));
		if (tournament.creator === user.username)
		{
			if (!tournament.is_started)
				document.getElementById('admin_button_container').appendChild(createButton('Forcé le démarage du tournois', startTournament));
			document.getElementById('admin_button_container').appendChild(createButton('supprimer le tournois', deleteTournament));
		}
}

function createMatchElement(match) {
	
	const matchEl = document.createElement('div');
	matchEl.className = 'match';
	let player1El = createPlayerElement(match.player1);
	let player2El = createPlayerElement(match.player2);
	
	if (match.winner != null) {
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



function createButton(text, onClick) {
	const button = document.createElement('button');
	button.className = 'button';
	button.textContent = text;
	button.onclick = onClick;
	return button;
}

async function startTournament(){
	if (!window.activeTournament)
	{
		alert('Aucun tournois selectionné');
		return;
	}
	try {
		const response = await fetch('/api/tournament/set_start_tournament/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'),
			},
			body: JSON.stringify({tournamentId: window.activeTournament.id}),
		});
		
		if (response.ok) {
			alert('Tournois démarré avec succès !');
			navigateTo('/tournaments/' + window.activeTournament.id);
		} else {
			const errorData = await response.json();
			alert('imposible de démarrer le tournois : ' + errorData.error);
		}
	} catch (error) {
		console.error('Erreur lors de la requête :', error);
		alert('Une erreur est survenue. Veuillez réessayer plus tard.');
	}
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
	}
}

function createWinnerElement(tournament) {
	const roundEl = document.createElement('div');
	roundEl.className = 'round';
	const matchEl = document.createElement('div');
	matchEl.className = 'match';
	const winnerEl = document.createElement('div');
	winnerEl.className = 'player';
	if (tournament.winner != null) {
		winnerEl.classList.add('winner');
	}
	winnerEl.textContent = tournament.winner;
	matchEl.appendChild(winnerEl);
	roundEl.appendChild(matchEl);
	return roundEl;
}