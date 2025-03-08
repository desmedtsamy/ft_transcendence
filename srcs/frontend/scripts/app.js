window.user;
window.selected_game;


async function fetchUserInfo() {
	if (window.selected_game === "pong")
		setPongLoader();
	else
		setTicTacToeLoader();
	try {
		const response = await fetch('/api/account/current-user/', {
			method: 'GET',
			credentials: 'include',
		});

		if (response.ok) {
			const data = await response.json();
			if (data.is_authenticated) {
				handleUserAuthenticated(data.user);
				setNotification();
			} else {
				handleUserNotAuthenticated();
				console.log('User is not authenticated');
			}
		} else {
			console.error('Failed to fetch user information');
		}
	} catch (error) {
		console.error('Error:', error);
	}
}
window.changeCSS = function (game) {
	let linkElement = document.getElementById('gameStylesheet');
	if (!linkElement) {
		linkElement = document.createElement('link');
		linkElement.rel = 'stylesheet';
		linkElement.id = 'gameStylesheet';
		document.head.appendChild(linkElement);
	}
	
	if (game === 'pong') {
		linkElement.href = '/css/pong.css';
	} else if (game === 'tictactoe') {
		linkElement.href = '/css/tictactoe.css';
	}
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

	// FOR DEBUG
	console.log('Alert:', message);
}

document.addEventListener('DOMContentLoaded', async () => {
	window.selected_game = document.getElementById('gameSelector').value;
	await fetchUserInfo();
	
	const gameSelector = document.getElementById('gameSelector');
	if (gameSelector) {
		// First check localStorage
		const savedGame = localStorage.getItem('selectedGame');
		
		if (window.user !== null) {
			// For authenticated users, use their server-side preference
			gameSelector.value = window.user.selected_game;
			window.selected_game = window.user.selected_game;
			// Update localStorage to match server preference
			localStorage.setItem('selectedGame', window.user.selected_game);
		} else {
			// For non-authenticated users, use localStorage or default to 'pong'
			gameSelector.value = savedGame || 'pong';
			window.selected_game = savedGame || 'pong';
		}
		
		window.changeCSS(gameSelector.value);
		gameSelector.addEventListener('change', function() {
			setSelectedGame(gameSelector.value);
			window.changeCSS(gameSelector.value);
		});
	}
	
	document.addEventListener('click', (event) => {
		if (event.target.closest('[data-link]')) {
			event.preventDefault();
            const path = event.target.closest('[data-link]').getAttribute('data-link');
			navigateTo(path);
        }
    });
    window.addEventListener('popstate', () => {
		navigateTo(window.location.pathname);
    });
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
	console.log("activity updated");
}

setInterval(updateLastActivity, 60000);