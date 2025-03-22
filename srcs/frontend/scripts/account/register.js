async function getClientAPI(){
	try {
		const link = document.getElementById('login_42');
        const csrftoken = getCookie('csrftoken');
        const response = await fetch('/api/account/42client/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            credentials: 'include',
        });
		if (response.ok) {
			const response_json = await response.json();
			const client_id = response_json.client_id;
			const redirect_uri = response_json.redirect_uri;
			link.href = `https://api.intra.42.fr/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code`;
		} else {
			link.style.display = 'none';
			const result = await response.json();
			alert(result.error || 'Échec de connexion avec 42');
		}

    } catch (error) {
		alert(error || 'Échec de connexion avec 42');
    }
}

function onLoad() {
	getClientAPI();
	const form = document.getElementById('register-form');
	const messageDiv = document.getElementById('message');

	// Validation côté client
	function validateForm(data) {
		const errors = {};
		
		if (data.username.length < 3) {
			errors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères";
		} else if (data.username.length > 30) {
			errors.username = "Le nom d'utilisateur ne doit pas dépasser 30 caractères";
		}
		
		// Validation de l'email
		if (!data.email) {
			errors.email = "L'email est requis";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
			errors.email = "L'email n'est pas valide";
		}
		
		// Validation du mot de passe
		if (!data.password) {
			errors.password = "Le mot de passe est requis";
		} else if (data.password.length < 8) {
			errors.password = "Le mot de passe doit contenir au moins 6 caractères";
		}
		
		return { isValid: Object.keys(errors).length === 0, errors };
	}

	// Afficher les messages d'erreur
	function displayErrors(errors) {
		// Réinitialiser les messages d'erreur précédents
		const errorElements = document.querySelectorAll('.error-message');
		errorElements.forEach(element => element.remove());
		
		// Afficher les nouvelles erreurs
		Object.keys(errors).forEach(field => {
			const inputElement = document.querySelector(`[name="${field}"]`);
			if (inputElement) {
				const errorDiv = document.createElement('div');
				errorDiv.className = 'error-message';
				errorDiv.style.color = 'red';
				errorDiv.style.fontSize = '14px';
				errorDiv.style.marginTop = '5px';
				errorDiv.textContent = errors[field];
				inputElement.parentNode.appendChild(errorDiv);
			}
		});
	}

	async function handleRegister(event) {
		event.preventDefault();
		const formData = new FormData(event.target);
		const data = {
			username: formData.get('username'),
			email: formData.get('email'),
			password: formData.get('password'),
		};

		// Validation côté client
		const { isValid, errors } = validateForm(data);
		if (!isValid) {
			displayErrors(errors);
			return;
		}

		try {
			const response = await fetch('/api/account/register/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': getCookie('csrftoken'),
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				const user = await response.json();
				// Fetch friends data after successful registration
				const friendsResponse = await fetch('/api/account/friends/', {
					method: 'GET',
					headers: {
						'X-CSRFToken': getCookie('csrftoken'),
					},
					credentials: 'include',
				});
				const friends = friendsResponse.ok ? await friendsResponse.json() : [];
				
				alert("Bonjour " + user.username);
				handleUserAuthenticated(user, friends);
				navigateTo('/');
			} else {
				const errorData = await response.json();
				const displayedErrors = {};
				
				if (errorData.username) {
					displayedErrors.username = errorData.username[0];
				}
				if (errorData.email) {
					displayedErrors.email = errorData.email[0];
				}
				if (errorData.password) {
					displayedErrors.password = errorData.password[0];
				}
				
				if (Object.keys(displayedErrors).length > 0) {
					displayErrors(displayedErrors);
				} else if (errorData.non_field_errors) {
					alert(errorData.non_field_errors.join('\n'));
				} else {
					alert(errorData.error || 'Échec de l\'inscription');
				}
			}
		} catch (error) {
			console.error('Erreur:', error);
			alert('Erreur lors de la connexion au serveur');
		}
	}

	form.addEventListener('submit', handleRegister);
}
export { onLoad };