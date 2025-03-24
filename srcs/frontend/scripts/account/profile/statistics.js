/**
 * Crée et affiche un graphique d'évolution du score de l'utilisateur
 * @param {Array} matches - Historique des matchs
 * @param {Object} user - Données de l'utilisateur
 */
export function renderScoreChart(matches, user) {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    let scoreChart;

    // Si aucun match ou graphique déjà existant
    if (scoreChart) {
        scoreChart.destroy();
    }
    
    // Si aucun match, afficher seulement le score actuel
    if (!matches || matches.length === 0) {
        const scoreData = [user.scores[user.selected_game]];
        const labels = ['Score actuel'];
        return createChart(ctx, labels, scoreData);
    }
    
    // Si un seul match, afficher seulement le score final
    if (matches.length === 1) {
        const scoreData = [user.scores[user.selected_game]];
        const labels = ['Score actuel'];
        return createChart(ctx, labels, scoreData);
    }
    
    // Utiliser tous les matchs sans limitation
    let matchSelection = matches;
    
    // Initialiser avec le score actuel
    const scoreData = [user.scores[user.selected_game]];
    const labels = ['Actuel'];
    
    // Parcourir les matchs sélectionnés dans l'ordre chronologique inverse (du plus récent au plus ancien)
    let currentScore = user.scores[user.selected_game];
    
    for (let i = 0; i < matchSelection.length; i++) {
        const match = matchSelection[i];
        
        // Déterminer si l'utilisateur est le gagnant
        const userIsWinner = match.winner && match.winner.id === user.id;
        
        // Calculer les points gagnés/perdus (inverse car on va dans le passé)
        const pointsChange = userIsWinner ? -42 : 19;
        
        // Mettre à jour le score pour ce point dans le temps (en allant dans le passé)
        currentScore += pointsChange;
        // S'assurer que le score n'est jamais négatif
        currentScore = Math.max(0, currentScore);
        
        // Ajouter les données au graphique
        scoreData.push(currentScore);
        labels.push(`Match ${matchSelection.length - i}`);
    }
    
    // Inverser les tableaux pour avoir l'ordre chronologique (du plus ancien au plus récent)
    scoreData.reverse();
    labels.reverse();
    
    // Créer le graphique avec les données préparées
    return createChart(ctx, labels, scoreData);
}

/**
 * Crée un graphique Chart.js avec les données fournies
 * @param {CanvasRenderingContext2D} ctx - Contexte de canvas
 * @param {Array} labels - Labels pour l'axe X
 * @param {Array} scoreData - Données de score
 * @returns {Chart} - L'instance Chart.js créée
 */
function createChart(ctx, labels, scoreData) {
    // Get the primary color from CSS variables
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();
    
    return new Chart(ctx, {
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
                },
                title: {
                    display: true,
                    text: 'Évolution du score',
                    color: primaryColor,
                    font: {
                        size: 16
                    }
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