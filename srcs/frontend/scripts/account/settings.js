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
			const sync_uri = response_json.sync_uri;
			link.href = `https://api.intra.42.fr/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(sync_uri)}&response_type=code`;
		} else {
			link.style.display = 'none';
			const result = await response.json();
			showMessage(result.error || 'Échec de connexion avec 42', 'danger');
		}

    } catch (error) {
		showMessage('Échec de connexion avec 42', 'danger');
    }
}

function onLoad() {
	if (window.user != undefined) {
		document.getElementById('username_input').value = window.user.username;
		document.getElementById('email').value = window.user.email;
	}
	const form = document.getElementById('settings-form');
	
	// Fonction pour afficher un message général
	function showMessage(message, type = 'danger') {
		const messageContainer = document.getElementById('message-container');
		const messageElement = document.getElementById('message');
		
		if (message.includes('<br>') || message.includes('<') && message.includes('>')) {
			// Si le message contient du HTML, utiliser innerHTML
			messageElement.innerHTML = message;
		} else {
			// Sinon, utiliser textContent pour éviter les injections XSS
			messageElement.textContent = message;
		}
		
		messageElement.className = `alert alert-${type}`;
		messageContainer.style.display = 'block';
		
		// Scroll jusqu'au message
		messageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
	
	// Fonction pour effacer tous les messages d'erreur
	function clearErrors() {
		// Cacher le message général
		document.getElementById('message-container').style.display = 'none';
		
		// Effacer tous les messages d'erreur spécifiques
		const errorElements = document.querySelectorAll('.error-message');
		errorElements.forEach(element => {
			element.textContent = '';
		});
	}
	
	// Fonction pour afficher des erreurs spécifiques
	function displayFieldError(fieldId, errorMessage) {
		const errorElement = document.getElementById(`${fieldId}-error`);
		if (errorElement) {
			errorElement.textContent = errorMessage;
		}
	}
	
	// Validation du formulaire
	function validateForm(data) {
		let isValid = true;
		clearErrors();
		
		// Validation du nom d'utilisateur
		if (data.get('username') && data.get('username').length < 3) {
			displayFieldError('username', "Le nom d'utilisateur doit contenir au moins 3 caractères");
			isValid = false;
		}
		
		// Validation de l'email
		const email = data.get('email');
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			displayFieldError('email', "Format d'email invalide");
			isValid = false;
		}
		
		// Validation des mots de passe
		const oldPassword = data.get('old_password');
		const newPassword1 = data.get('new_password1');
		const newPassword2 = data.get('new_password2');
		
		if (oldPassword || newPassword1 || newPassword2) {
			// Si un des champs est rempli, tous doivent l'être
			if (!oldPassword) {
				displayFieldError('old-password', "L'ancien mot de passe est requis");
				isValid = false;
			}
			
			if (!newPassword1) {
				displayFieldError('new-password1', "Le nouveau mot de passe est requis");
				isValid = false;
			} else if (newPassword1.length < 8) {
				displayFieldError('new-password1', "Le mot de passe doit contenir au moins 8 caractères");
				isValid = false;
			}
			
			if (!newPassword2) {
				displayFieldError('new-password2', "La confirmation du mot de passe est requise");
				isValid = false;
			} else if (newPassword1 !== newPassword2) {
				displayFieldError('new-password2', "Les mots de passe ne correspondent pas");
				isValid = false;
			}
		}
		
		return isValid;
	}
	
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		clearErrors();
	
		const formData = new FormData(form);
		
		if (!validateForm(formData)) {
			return;
		}
		
		try {
			const response = await fetch('/api/account/settings/',
				{
					method: 'PATCH',
					headers: {
						'X-CSRFToken': getCookie('csrftoken'),
					},
					body: formData,
				});
	
			if (response.ok) {
				const userData = await response.json();
				alert('Paramètres mis à jour avec succès !', 'success');
				fetchUserInfo();
				navigateTo("/");
			} else {
				const errorData = await response.json();
				
				if (errorData.username) {
					const usernameError = Array.isArray(errorData.username) 
						? errorData.username[0]
						: errorData.username;
					
					let friendlyMessage = usernameError;
					if (usernameError.includes("existe déjà")) {
						friendlyMessage = "Ce nom d'utilisateur est déjà utilisé. Veuillez en choisir un autre.";
					}
					
					displayFieldError('username', friendlyMessage);
				}
				if (errorData.email) {
					const emailError = Array.isArray(errorData.email) 
						? errorData.email[0] 
						: errorData.email;
					
					let friendlyMessage = emailError;
					if (emailError.includes("existe déjà")) {
						friendlyMessage = "Cette adresse email est déjà utilisée. Veuillez en utiliser une autre.";
					}
					
					displayFieldError('email', friendlyMessage);
				}
				if (errorData.avatar) {
					const avatarError = Array.isArray(errorData.avatar) 
						? errorData.avatar[0] 
						: errorData.avatar;
					displayFieldError('avatar', avatarError);
				}
				if (errorData.old_password) {
					const oldPasswordError = Array.isArray(errorData.old_password) 
						? errorData.old_password[0] 
						: errorData.old_password;
					
					let friendlyMessage = oldPasswordError;
					if (oldPasswordError.includes("incorrect")) {
						friendlyMessage = "L'ancien mot de passe est incorrect.";
					}
					
					displayFieldError('old-password', friendlyMessage);
				}
				if (errorData.password) {
					const passwordError = Array.isArray(errorData.password) 
						? errorData.password[0] 
						: errorData.password;
					displayFieldError('new-password1', passwordError);
				}
				
				// Message d'erreur général
				if (errorData.error) {
					// Si l'erreur est un objet JSON, la convertir en message lisible
					if (typeof errorData.error === 'object') {
						// Extraire les messages d'erreur et les afficher de manière conviviale
						let errorMessages = [];
						for (const [key, value] of Object.entries(errorData.error)) {
							const errorValue = Array.isArray(value) ? value[0] : value;
							const fieldName = key.charAt(0).toUpperCase() + key.slice(1); // Première lettre en majuscule
							errorMessages.push(`${fieldName}: ${errorValue}`);
						}
						showMessage(errorMessages.join('<br>'));
					} else {
						showMessage(errorData.error);
					}
				} else if (errorData.non_field_errors) {
					// Si les erreurs non liées aux champs sont dans un tableau, les joindre
					if (Array.isArray(errorData.non_field_errors)) {
						showMessage(errorData.non_field_errors.join('<br>'));
					} else {
						showMessage(errorData.non_field_errors);
					}
				} else if (!Object.keys(errorData).some(key => ['username', 'email', 'avatar', 'old_password', 'password'].includes(key))) {
					showMessage('Une erreur est survenue lors de la mise à jour des paramètres');
				}
			}
		} catch (error) {
			console.error('Erreur lors de la requête :', error);
			showMessage('Une erreur est survenue. Veuillez réessayer plus tard.');
		}
	});
	
	if (window.user.intra_id)
		document.getElementById('login_42').style.display = 'none';
	else
		getClientAPI();
}
export { onLoad };