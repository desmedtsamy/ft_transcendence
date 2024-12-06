let activeTournament = null;


function createTournamentModal() {
	document.getElementById('tournamentModal').style.display = 'flex';
}

function closeModal() {
	document.getElementById('tournamentModal').style.display = 'none';
}


async function handleCreateTournament(event) {
    event.preventDefault();
	
    const formData = new FormData(event.target);
    const tournamentData = {};
    for (const [key, value] of formData.entries()) {
		tournamentData[key] = value;
    }
	
    try {
		const response = await fetch('/api/tournament/create_tournament/', {
			method: 'POST',
            headers: {
				'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify(tournamentData),
        });
		
        if (response.ok) {
			const createdTournament = await response.json();
            console.log('Tournoi créé :', createdTournament);
			closeModal();
            populateTournaments(createdTournament.id);
            alert('Tournoi créé avec succès !');
        } else {
			const errorData = await response.json();
            alert('Erreur lors de la création du tournoi : ' + errorData.error);
        	console.log('Erreur lors de la création du tournoi : ' + errorData.error);
        }
    } catch (error) {
		console.error('Erreur lors de la requête :', error);
        alert('Une erreur est survenue. Veuillez réessayer plus tard.');
    }
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
		activeTournament = data;
		document.getElementById('tournament_name').textContent = data.name;
		renderTournament(data);
	});
}

function populateTournaments(tournamentId)
{
	fetch('/api/tournament/getTournaments/')
	.then(response => response.json())
	.then(data => {
		const tournamentList = document.getElementById('tournament-list');
		tournamentList.innerHTML = '';
		data["tournaments"].forEach(tournament => {
			const tournamentEl = document.createElement('div');
			tournamentEl.className = 'tournament-item';
			tournamentEl.textContent = tournament.name;
			tournamentEl.textContent += " " + tournament.players_count;
			tournamentEl.textContent += "/" + tournament.number_of_players;
			
			tournamentEl.dataset.tournamentId = tournament.id;
			tournamentEl.onclick = function() {
				selectTournament(tournamentEl);
			}
			if (tournamentId && tournamentId === tournament.id) {
				selectTournament(tournamentEl);
			}
			tournamentList.appendChild(tournamentEl);
		});
	});
}

function getTournamentIdFromURL() {
    const urlParts = window.location.pathname.split('/');
    const tournamentId = urlParts[urlParts.length - 1];
    return tournamentId && !isNaN(tournamentId) ? parseInt(tournamentId) : null;
}

function onLoad()
{
	const createTournamentForm = document.getElementById('create-tournament-form');
	if (createTournamentForm) {
		createTournamentForm.addEventListener('submit', handleCreateTournament);
	}
	const tournamentId = getTournamentIdFromURL();
	populateTournaments(tournamentId);
	console.log(tournamentId);
}

export { onLoad };

window.createTournamentModal = createTournamentModal;
window.closeModal = closeModal;
window.joinTournament = joinTournament;
window.leaveTournament = leaveTournament;

async function joinTournament(){
	if (!activeTournament)
	{
		alert('Aucun tournois selectionné');
		return;
	}
	try {
		const response = await fetch('/api/tournament/join_tournament/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'),
			},
			body: JSON.stringify({tournamentId: activeTournament.id}),
		});
		
		if (response.ok) {
			alert('Tournois rejoint avec succès !');
			navigateTo('/tournaments/' + activeTournament.id);
		} else {
			const errorData = await response.json();
			alert('imposible de rejoindre le tournois : ' + errorData.error);
		}
	} catch (error) {
		console.error('Erreur lors de la requête :', error);
		alert('Une erreur est survenue. Veuillez réessayer plus tard.');
	}
}

async function leaveTournament(){
	if (activeTournament)
	{
		try {
			const response = await fetch('/api/tournament/leave_tournament/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': getCookie('csrftoken'),
				},
				body: JSON.stringify({tournamentId: activeTournament.id}),
			});
			
			if (response.ok) {
				alert('Tournois quité avec succès !');
				navigateTo('/tournaments/' + activeTournament.id);
			} else {
				const errorData = await response.json();
				alert('imposible de quité le tournois : ' + errorData.error);
			}
		} catch (error) {
			console.error('Erreur lors de la requête :', error);
			alert('Une erreur est survenue. Veuillez réessayer plus tard.');
		}
	}
	else
	{
		alert('Aucun tournois selectionné');
	}
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
			document.getElementById('admin_button_container').appendChild(createButton('Démarrer le tournois', startTournament));
			document.getElementById('admin_button_container').appendChild(createButton('supprimer le tournois', deleteTournament));
		}
}

function createButton(text, onClick) {
	const button = document.createElement('button');
	button.className = 'button';
	button.textContent = text;
	button.onclick = onClick;
	return button;
}

async function startTournament(){
	if (!activeTournament)
	{
		alert('Aucun tournois selectionné');
		return;
	}
	try {
		const response = await fetch('/api/tournament/start_tournament/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'),
			},
			body: JSON.stringify({tournamentId: activeTournament.id}),
		});
		
		if (response.ok) {
			alert('Tournois démarré avec succès !');
			navigateTo('/tournaments/' + activeTournament.id);
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
	if (!activeTournament)
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
			body: JSON.stringify({tournamentId: activeTournament.id}),
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

// Ferme la modal si l'utilisateur clique en dehors du contenu de la modal
window.onclick = function(event) {
	const modal = document.getElementById('tournamentModal');
	if (event.target == modal) {
		modal.style.display = 'none';
	}
}