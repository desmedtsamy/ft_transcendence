window.user;

document.addEventListener('DOMContentLoaded', () => {
	document.addEventListener('click', (event) => {
		if (event.target.closest('[data-link]')) {
			event.preventDefault();
            const path = event.target.closest('[data-link]').getAttribute('data-link');
			navigateTo(path);
        }
    });
	
	
    window.addEventListener('popstate', (event) => {
		const path = window.location.pathname;
		// If we have state and it contains a path, use that instead
		if (event.state && event.state.path) {
			render(event.state.path);
		} else {
			// Otherwise fallback to current pathname
			render(path);
		}
    });

	// Initialize the history state for the current page
	window.history.replaceState({ path: window.location.pathname }, '', window.location.pathname);
	
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
	
	function createLoadingSpinner() {
		console.log("DEBUG createLoadingSpinner")
		const app = document.getElementById('app');
		const loadingElement = document.createElement('div');
		loadingElement.className = 'loading-dots';
		loadingElement.innerHTML = '<span>Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span>';
		app.innerHTML = '';
		app.appendChild(loadingElement);
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