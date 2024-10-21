function createTournamentModal() {
	document.getElementById('tournamentModal').style.display = 'flex'; // Montre le modal et le centre
}

function closeModal() {
	document.getElementById('tournamentModal').style.display = 'none'; // Cache le modal
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
			closeModal();
            populateTournaments();
            alert('Tournoi créé avec succès !');
        } else {
			const errorData = await response.json();
            alert('Erreur lors de la création du tournoi : ' + JSON.stringify(errorData));
        	console.log('Erreur lors de la création du tournoi : ' + JSON.stringify(errorData));
        }
    } catch (error) {
		console.error('Erreur lors de la requête :', error);
        alert('Une erreur est survenue. Veuillez réessayer plus tard.');
    }
}


function selectTournament(element) {
	
	// Supprimer la classe 'selected' de tous les éléments .tournoi-item
	document.querySelectorAll('.tournoi-item.selected').forEach(item => {
		item.classList.remove('selected');
	});
	
	// Ajouter la classe 'selected' à l'élément cliqué
	element.classList.add('selected');
	// Récupérer l'ID du tournoi à partir de l'élément cliqué
	const tournamentId = element.dataset.tournamentId;
	
	// Faire une requête pour récupérer les détails du tournoi
	fetch(`/api/tournament/${tournamentId}/`)
	.then(response => response.json())
	.then(data => {	
		document.getElementById('tournament_name').textContent = data.name;
		renderTournament(data);
	});
}

function populateTournaments()
{
	fetch('/api/tournament/getTournaments/')
	.then(response => response.json())
	.then(data => {
		const tournamentList = document.getElementById('tournament-list');
		tournamentList.innerHTML = '';
		data.forEach(tournament => {
			const tournamentEl = document.createElement('div');
			tournamentEl.className = 'tournament-item';
			tournamentEl.textContent = tournament.name;
			tournamentEl.dataset.tournamentId = tournament.id;
			tournamentEl.onclick = function() {
				selectTournament(tournamentEl);
			}
			tournamentList.appendChild(tournamentEl);
		});
	});
}

function onLoad()
{
	
	const createTournamentForm = document.getElementById('create-tournament-form');
	if (createTournamentForm) {
		createTournamentForm.addEventListener('submit', handleCreateTournament);
	}
	populateTournaments();
}

export { onLoad };

window.createTournamentModal = createTournamentModal;
window.closeModal = closeModal;
// window.joinTournament = joinTournament;
// window.leaveTournament = leaveTournament;




function renderTournament(tournament) {
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
	else {
		const buttonEl = document.createElement('button');
		buttonEl.textContent = 'set winner';
		buttonEl.onclick = function() {
			fetch('/tournament/set-winner/', {
				method: 'POST',
                headers: {
					'Content-Type': 'application/json',
					// 'X-CSRFToken': getCSRFToken()  // Inclure le CSRF token si nécessaire
                },
                body: JSON.stringify({
					match_id: match.id,
                    winner_id: match.player1_id
                })
            })
            .then(response => response.json())
            .then(data => {
				if (data.status === 'success') {
					console.log('Vainqueur défini avec succès:', data.message);
                } else {
					console.error('Erreur:', data.message);
                }
            })
            .catch(error => {
				console.error('Erreur lors de la requête:', error);
            });
		}
		matchEl.appendChild(buttonEl);
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