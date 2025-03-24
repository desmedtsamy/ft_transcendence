/**
 * Formate une date en texte "il y a X minutes/heures/jours"
 * @param {string} timestamp - Timestamp à formater
 * @returns {string} - Texte formaté
 */
export function formatTimeAgo(timestamp) {
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

/**
 * Calcule le ratio de victoires/défaites en pourcentage
 * @param {number} wins - Nombre de victoires
 * @param {number} losses - Nombre de défaites
 * @returns {string} - Pourcentage formaté
 */
export function calculateWinLossRatio(wins, losses) {
	const totalMatches = wins + losses;
    if (totalMatches === 0) return 0; 
    return ((wins / totalMatches) * 100).toFixed(2); 
}

/**
 * Charge un script externe et exécute un callback quand il est chargé
 * @param {string} src - URL du script
 * @param {Function} callback - Fonction à exécuter après chargement
 */
export function loadScript(src, callback) {
    var script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    document.head.appendChild(script);
}

/**
 * Récupère un cookie par son nom
 * @param {string} name - Nom du cookie
 * @returns {string} - Valeur du cookie
 */
export function getCookie(name) {
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