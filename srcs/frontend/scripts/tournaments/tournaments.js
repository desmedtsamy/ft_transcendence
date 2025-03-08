import {populateTournaments} from './match.js';
import {createModal, closeModal} from './../modal.js';

window.activeTournament = null;


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



function getTournamentIdFromURL() {
    const urlParts = window.location.pathname.split('/');
    const tournamentId = urlParts[urlParts.length - 1];
    return tournamentId && !isNaN(tournamentId) ? parseInt(tournamentId) : null;
}

window.joinTournament = joinTournament;
window.leaveTournament = leaveTournament;

async function joinTournament(){
	if (!window.activeTournament)
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
			body: JSON.stringify({tournamentId: window.activeTournament.id}),
		});
		
		if (response.ok) {
			alert('Tournois rejoint avec succès !');
			navigateTo('/tournaments/' + window.activeTournament.id);
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
	if (window.activeTournament)
	{
		try {
			const response = await fetch('/api/tournament/leave_tournament/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': getCookie('csrftoken'),
				},
				body: JSON.stringify({tournamentId: window.activeTournament.id}),
			});
			
			if (response.ok) {
				alert('Tournois quitté avec succès !');
				navigateTo('/tournaments/' + window.activeTournament.id);
			} else {
				const errorData = await response.json();
				alert('imposible de quitté le tournois : ' + errorData.error);
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

function onLoad()
{
	const createTournamentForm = document.getElementById('create-tournament-form');
	if (createTournamentForm) {
		createTournamentForm.addEventListener('submit', handleCreateTournament);
	}
	const tournamentId = getTournamentIdFromURL();
	populateTournaments(tournamentId);
}

export { onLoad };