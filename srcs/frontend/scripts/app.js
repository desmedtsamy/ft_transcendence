
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (event) => {
		if (event.target.matches('[data-link]')) {
			event.preventDefault();
            const path = event.target.getAttribute('data-link');
            navigateTo(path);
        }
    });
	
	
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
				const data = await response.json();
				if (data.is_authenticated) {
					handleUserAuthenticated(data.user); 
				} else {
					handleUserNotAuthenticated();
					// DEBUG
					console.log('User is not authenticated');
				}
			} else {
				console.error('Failed to fetch user information');
			}
		} catch (error) {
			console.error('Error:', error);
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
	render(window.location.pathname);
	fetchUserInfo();


	window.alert = function(message) {
		const alertsEl = document.getElementById('alerts');
		const alertEl = document.createElement('div');
		alertEl.className = 'alert';
		alertEl.textContent = message;
		alertEl.style.display = 'block';
		alertsEl.appendChild(alertEl);
		setTimeout(() => {
			alertEl.style.display = 'none';
		}, 5000);
	}

});