import { getCookie } from './utils.js';
import { renderScoreChart } from './statistics.js';

/**
 * Récupère l'historique des matchs pour un utilisateur
 * @param {Object} userData - Données de l'utilisateur
 * @param {string} selectedGame - Type de jeu sélectionné
 */
export async function fetchMatchesData(userData, selectedGame) {
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
 * @param {string} gameType - Type de jeu
 */
export function updateMatchesHeader(gameType) {
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

/**
 * Affiche la liste des matchs récents
 * @param {Array} matches - Liste des matchs
 * @param {Object} userData - Données de l'utilisateur
 */
export function renderRecentMatches(matches, userData) {
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
        const dataCol3 = document.createElement('div');

        // Ajout de la date de fin dans dataCol1
        dataCol1.textContent = match.end_date ? 
            new Date(match.end_date).toLocaleDateString() :
            'N/A';
        
        if (match.game_type === 'pong') {
            // Pour Pong: Durée et Score
            dataCol2.textContent = match.data && match.data.duration ? 
                `${Math.floor(match.data.duration / 60)}m${match.data.duration % 60}s` : 
                'N/A';
            
            dataCol3.textContent = match.data && match.data.scores ? 
                `${match.data.scores[1]} / ${match.data.scores[2]}` : 
                'N/A';
        } else if (match.game_type === 'tictactoe') {
            // Pour Tic-tac-toe: Nombre de coups et Match nul
            dataCol2.textContent = match.data && match.data.moves ? 
                `${match.data.moves} coups` : 
                'N/A';
            
            dataCol3.textContent = match.data && match.data.draws !== undefined ? 
                match.data.draws : 'N/A';
        }

        // Assemblage des éléments - Ajout de dataCol1 dans l'ordre
        listItem.append(
            playersDiv,
            resultDiv,
            dataCol1,
            dataCol2,
            dataCol3
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