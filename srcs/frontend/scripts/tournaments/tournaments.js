import {populateTournaments} from './match.js';
import {createModal, closeModal} from './../modal.js';

window.activeTournament = null;

// Ensure getCookie function is defined
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Make getCookie available globally
window.getCookie = getCookie;

// Check if user is authenticated
async function checkAuthentication() {
    try {
        const response = await fetch('/api/account/current-user/', {
            method: 'GET',
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            return data.is_authenticated;
        }
        return false;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

async function handleCreateTournament(event) {
    event.preventDefault();

    // Check authentication first
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
        if (window.tournamentModal) {
            window.tournamentModal.hide();
        }
        alert('Please log in to create a tournament');
        navigateTo('/login');
        return;
    }
    
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
            credentials: 'include',
            body: JSON.stringify(tournamentData),
        });
        
        if (response.ok) {
            const createdTournament = await response.json();
            window.tournamentModal.hide();
            populateTournaments(createdTournament.id);
            alert('Tournoi créé avec succès !');
        } else if (response.status === 403) {
            alert('Session expired. Please log in again.');
            navigateTo('/login');
        } else {
            const errorData = await response.json();
            alert('Erreur lors de la création du tournoi : ' + errorData.error);
        }
    } catch (error) {
        console.error('Erreur lors de la requête :', error);
        alert('Une erreur est survenue. Veuillez réessayer plus tard.');
		navigateTo('/tournaments');
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
			navigateTo('/tournaments/' + window.activeTournament.id);
        }
    } catch (error) {
        console.error('Erreur lors de la requête :', error);
        alert('Une erreur est survenue. Veuillez réessayer plus tard.');
		navigateTo('/tournaments/' + window.activeTournament.id);
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
                alert('Tournois quité avec succès !');
                navigateTo('/tournaments/' + window.activeTournament.id);
            } else {
                const errorData = await response.json();
                alert('imposible de quité le tournois : ' + errorData.error);
				navigateTo('/tournaments/' + window.activeTournament.id);
            }
        } catch (error) {
            console.error('Erreur lors de la requête :', error);
            alert('Une erreur est survenue. Veuillez réessayer plus tard.');
			navigateTo('/tournaments/' + window.activeTournament.id);
        }
    }
    else
    {
        alert('Aucun tournois selectionné');
    }
}

function onLoad() {
	if (window.user)
		document.getElementById("create_tournament_btn").style.display = 'block'
	else
		document.getElementById("create_tournament_btn").style.display = 'none'
    // Initialize Bootstrap modal
    const modalElement = document.getElementById('Modal');
    if (modalElement && typeof bootstrap !== 'undefined') {
        window.tournamentModal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true
        });
    }

    // Initialize form event listener
    const createTournamentForm = document.getElementById('create-tournament-form');
    if (createTournamentForm) {
        createTournamentForm.addEventListener('submit', handleCreateTournament);
    }

    // Load tournaments
    const tournamentId = getTournamentIdFromURL();
    populateTournaments(tournamentId);
}

// Modal control functions
window.createModal = function() {
    const modalElement = document.getElementById('Modal');
    if (!window.tournamentModal && modalElement) {
        window.tournamentModal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });
    }
    if (window.tournamentModal) {
        window.tournamentModal.show();
    }
};

window.closeModal = function() {
    if (window.tournamentModal) {
        window.tournamentModal.hide();
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', onLoad);

export { onLoad };