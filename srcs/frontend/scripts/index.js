async function logout() {
    try {
        const csrftoken = getCookie('csrftoken');
        const response = await fetch('/api/account/logout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrftoken,
            },
            body: ``,
            credentials: 'include',
        });
		if (response.ok) {
			alert("Vous êtes déconnecté");
			handleUserNotAuthenticated();
			navigateTo('/');
		}

    } catch (error) {
        console.error('Error:', error);
    }
	window.user = null;
}

window.handleUserAuthenticated = function(user, friends) {
	window.user = user;
	window.friends = friends;
    const loginLink = document.getElementById('login-link');
    const profileMenu = document.getElementById('profile-menu');
    const adminLink = document.getElementById('admin-link');
    const usernameSpan = document.getElementById('username');
    const profilePic = document.getElementById('profile-pic');
    const searchLink = document.getElementById('search-link');
	const profileLink = document.getElementById('profile-link');
	
	if (usernameSpan) usernameSpan.textContent = user.username;
	if (profilePic) profilePic.src = user.avatar;
	if (profileLink) profileLink.dataset.link = '/profile/' + user.username;
	if (searchLink) searchLink.style.display = 'block';
	if (loginLink) loginLink.style.display = 'none';
	if (profileMenu) profileMenu.style.display = 'block';
	if (adminLink) {
		adminLink.style.display = user.is_staff ? 'block' : 'none';
	}
	const gameSelector = document.getElementById('gameSelector');
	if (gameSelector) {
		gameSelector.value = user.selected_game;
		window.changeCSS(user.selected_game);
		gameSelector.disabled = false;
	}
	window.setNotification()
}

window.setSelectedGame = async function (game) {
    // Store the selection in localStorage for all users
    localStorage.setItem('selectedGame', game);
    window.selected_game = game;

    // If user is authenticated, also update the server
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
            window.location.reload();
        }
    } else {
        window.location.reload();
    }
}


window.handleUserNotAuthenticated = function() {
    window.user = null;
    const loginLink = document.getElementById('login-link');
    const profileMenu = document.getElementById('profile-menu');
    const adminLink = document.getElementById('admin-link');
    const gameSelector = document.getElementById('gameSelector');
    const searchLink = document.getElementById('search-link');

    if (gameSelector) {
        const savedGame = localStorage.getItem('selectedGame') || 'pong';
        gameSelector.value = savedGame;
        window.selected_game = savedGame;
        window.changeCSS(savedGame);
        gameSelector.disabled = false;
    }
    
    loginLink.style.display = 'block';
    profileMenu.style.display = 'none';
    adminLink.style.display = 'none';
	searchLink.style.display = 'none';

	window.disconnectNotifications();
}