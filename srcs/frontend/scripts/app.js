
document.addEventListener('DOMContentLoaded', () => {
	const app = document.getElementById('app');
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const profileMenu = document.getElementById('profile-menu');
    const adminLink = document.getElementById('admin-link');
    const usernameSpan = document.getElementById('username');
    const profilePic = document.getElementById('profile-pic');
	
    document.addEventListener('click', (event) => {
		if (event.target.matches('[data-link]')) {
			event.preventDefault();
            const path = event.target.getAttribute('data-link');
            navigateTo(path);
        }
    });
	
	render('/');

    window.addEventListener('popstate', () => {
        render(window.location.pathname);
    });

    async function fetchUserInfo() {
        try {
            const response = await fetch('/api/account/current-user/', {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const user = await response.json();
                handleUserAuthenticated(user);
            } else {
                console.error('Failed to fetch user information');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function handleUserAuthenticated(user) {
        usernameSpan.textContent = user.username;
        profilePic.src = user.avatar; 
        loginLink.style.display = 'none';
        logoutLink.style.display = 'block';
        profileMenu.style.display = 'block';
        if (user.is_superuser) {
            adminLink.style.display = 'block';
        }
    }

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
});