window.user;


document.addEventListener('DOMContentLoaded', () => {
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
	
	function createLoadingSpinner() {
		console.log("DEBUG createLoadingSpinner")
		const app = document.getElementById('app');
		const spinner = document.createElement('div');
		spinner.className = 'spinner-border text-primary';
		spinner.innerHTML = '<span>Loading...</span>';
		app.innerHTML = '';
		app.appendChild(spinner);
	}
    async function fetchUserInfo() {
		// add loading spinner
		createLoadingSpinner();
		console.log("DEBUG fetchUser")
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

	navigateTo(window.location.pathname);
	fetchUserInfo();


	window.alert = function(message, type = 'normal') {
		const alertsEl = document.getElementById('alerts');
		const alertEl = document.createElement('div');
		
		alertEl.className = `alert alert-${type}`;
		alertEl.textContent = message;
		alertEl.style.display = 'block';
		
		alertsEl.appendChild(alertEl);
		
		setTimeout(() => {
			alertEl.style.display = 'none';
		}, 5000);


		// FOR DEBUG
		console.log('Alert:', message);
	}
	
});