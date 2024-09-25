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
		} else {
			console.log('Logout failed');
		}

    } catch (error) {
        console.error('Error:', error);
    }
	window.user = null;
}

window.handleUserAuthenticated = function(user) {

	window.user = user;
    const loginLink = document.getElementById('login-link');
    const profileMenu = document.getElementById('profile-menu');
    const adminLink = document.getElementById('admin-link');
    const usernameSpan = document.getElementById('username');
    const profilePic = document.getElementById('profile-pic');
	
	usernameSpan.textContent = user.username;
	profilePic.src = user.avatar;
	loginLink.style.display = 'none';
	profileMenu.style.display = 'block';
	if (user.is_superuser) {
		adminLink.style.display = 'block';
	}
}

window.handleUserNotAuthenticated = function() {
	window.user = null;
    const loginLink = document.getElementById('login-link');
    const profileMenu = document.getElementById('profile-menu');
    const adminLink = document.getElementById('admin-link');
	
	loginLink.style.display = 'block';
	profileMenu.style.display = 'none';
	adminLink.style.display = 'none';
}