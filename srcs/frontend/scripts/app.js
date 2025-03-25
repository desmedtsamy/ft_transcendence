window.user;
window.selected_game;
window.friends;
window.notification_socket;

async function fetchUserInfo() {
	createLoadingSpinner();
	
	if (window.selected_game === "pong")
		setPongLoader();
	else
		setTicTacToeLoader();
	try {
		const response = await fetch('/api/account/current-user/', {
			method: 'GET',
			credentials: 'include',
		});
		if (window.selected_game === "pong")
			deletePongLoader();
		else
			deleteTicTacToeLoader();
		if (response.ok) {
			const data = await response.json();
			if (data.is_authenticated) {
				window.friends = data.friends;
				handleUserAuthenticated(data.user, data.friends);
			} else {
				handleUserNotAuthenticated();
			}
		} else {
			handleUserNotAuthenticated();
			console.error('Failed to fetch user information');
		}
	} catch (error) {
		handleUserNotAuthenticated();
		console.error('Error:', error);
	}
}

function createLoadingSpinner() {
	const app = document.getElementById('app');
	const loadingElement = document.createElement('div');
	loadingElement.className = 'loading-dots';
	loadingElement.innerHTML = '<span>Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span>';
	app.innerHTML = '';
	app.appendChild(loadingElement);
}

window.changeCSS = function (game) {
	const existingStylesheet = document.getElementById('gameStylesheet');
	if (existingStylesheet) {
		existingStylesheet.remove();
	}
	const existingTournamentStylesheet = document.getElementById('tournamentStylesheet');
	if (existingTournamentStylesheet) {
		existingTournamentStylesheet.remove();
	}

	const linkElement = document.createElement('link');
	linkElement.rel = 'stylesheet';
	linkElement.id = 'gameStylesheet';
	
	const timestamp = new Date().getTime();
	if (game === 'pong') {
		linkElement.href = `/css/pong.css?v=${timestamp}`;
	} else if (game === 'tictactoe') {
		linkElement.href = `/css/tictactoe.css?v=${timestamp}`;
	}
	document.head.appendChild(linkElement);
}

window.getCookie = function(name) {
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

window.alert = function(message, type = 'normal') {
	const alertsEl = document.getElementById('alerts');
	const alertEl = document.createElement('div');
	
	alertEl.className = `alert alert-${type}`;
	if (typeof message === 'object' && message !== null && !Array.isArray(message)) {
		const ul = document.createElement('ul');
		ul.style.margin = '0';
		ul.style.paddingLeft = '20px';
		
		for (const [field, errors] of Object.entries(message)) {
			if (Array.isArray(errors)) {
				errors.forEach(error => {
					const li = document.createElement('li');
					li.textContent = error;
					ul.appendChild(li);
				});
			}
		}
		alertEl.appendChild(ul);
	} else {
		alertEl.textContent = message;
	}

	alertEl.style.display = 'block';
	
	alertsEl.appendChild(alertEl);
	
	setTimeout(() => {
		alertEl.style.display = 'none';
	}, 5000);
}

document.addEventListener('DOMContentLoaded', async () => {
	// Initialize the history state for the current page
	window.history.replaceState({ path: window.location.pathname + window.location.search }, '', window.location.pathname + window.location.search);
	
	// Setup game selector
	const gameMenu = document.getElementById('game-menu');
	const currentGameSpan = document.getElementById('current-game');
	const gameButton = currentGameSpan.parentElement;
	const gameIcon = gameButton.querySelector('i');
	
	function updateGameDisplay(game) {
		currentGameSpan.textContent = game.charAt(0).toUpperCase() + game.slice(1);
		gameIcon.className = game === 'pong' ? 'fas fa-table-tennis' : 'fas fa-times';
	}
	
	if (gameMenu) {
		gameMenu.addEventListener('click', async (event) => {
			const gameLink = event.target.closest('[data-game]');
			if (gameLink) {
				event.preventDefault();
				const game = gameLink.dataset.game;
				window.selected_game = game;
				updateGameDisplay(game);
				localStorage.setItem('selectedGame', game);
				
				if (window.user) {
					const csrftoken = getCookie('csrftoken');
					const response = await fetch('/api/account/set_selected_game/', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
							'X-CSRFToken': csrftoken,
						},
						body: `game=${game}`,
						credentials: 'include',
					});
					if (response.ok) {
						window.changeCSS(game);
						window.location.reload();
					}
				} else {
					window.changeCSS(game);
					window.location.reload();
				}
			}
		});

		// Set initial game selection
		const savedGame = localStorage.getItem('selectedGame') || 'pong';
		if (window.user && window.user.selected_game) {
			window.selected_game = window.user.selected_game;
			updateGameDisplay(window.user.selected_game);
			localStorage.setItem('selectedGame', window.user.selected_game);
		} else {
			window.selected_game = savedGame;
			updateGameDisplay(savedGame);
		}
		window.changeCSS(window.selected_game);
	}
	
	// Setup event listeners
	document.addEventListener('click', (event) => {
		if (event.target.closest('[data-link]')) {
			event.preventDefault();
			const path = event.target.closest('[data-link]').getAttribute('data-link');
			navigateTo(path);
			// Reapply CSS after navigation
			if (window.selected_game) {
				setTimeout(() => window.changeCSS(window.selected_game), 0);
			}
		}
	});
	
    window.addEventListener('popstate', (event) => {
        // If we have state and it contains a path, use that path
        if (event.state && event.state.path) {
            render(event.state.path);
        } else {
            // If no state, use current pathname
            render(window.location.pathname);
        }
        
        // Reapply CSS after navigation
        if (window.selected_game) {
            setTimeout(() => window.changeCSS(window.selected_game), 0);
        }
    });
	
	// Initialize Bootstrap components in the navbar
	if (typeof bootstrap !== 'undefined') {
		// Initialize navbar toggler
		const navbarToggler = document.querySelector('.navbar-toggler');
		if (navbarToggler) {
			const navbarContent = document.querySelector(navbarToggler.dataset.bsTarget);
			if (navbarContent) {
				new bootstrap.Collapse(navbarContent, {
					toggle: false
				});
			}
		}
		
		// Initialize dropdowns in the navbar
		const navbarDropdowns = document.querySelectorAll('nav .dropdown-toggle');
		navbarDropdowns.forEach(dropdown => {
			new bootstrap.Dropdown(dropdown);
		});
	}
	
	// Fetch user info
	await fetchUserInfo();
	
	// Navigate to current path
	navigateTo(window.location.pathname);
});

async function updateLastActivity() {
	if (window.user == null)
		return;
	try {
		const csrftoken = getCookie('csrftoken');
		await fetch('/api/update_activity/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrftoken,
			},
			credentials: 'include'
		});
	} catch (error) {
		console.error('Error updating activity:', error);
	}
}

window.updateFriends = async function() {
	try {
		const response = await fetch('/api/account/friends/', {
			method: 'GET',
			credentials: 'include',
		});
		
		if (!response.ok) {
			throw new Error('Erreur lors de la requête : ' + response.status);
		}
		
		const data = await response.json();
		window.friends = data;
		return data;
	} catch (error) {
		console.error('Erreur lors de la mise à jour des amis:', error);
		return [];
	}
}

setInterval(updateLastActivity, 60000);