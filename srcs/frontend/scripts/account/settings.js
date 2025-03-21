async function getClientAPI(){
	try {
		const link = document.getElementById('login_42');
        const csrftoken = getCookie('csrftoken');
        const response = await fetch('/api/account/42client/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
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
			alert(result.error || 'Login failed');
		}

    } catch (error) {
		alert(error || 'Login failed');
    }
}

function onLoad() {
	if (window.user != undefined) {
		document.getElementById('username_input').value = window.user.username;
		document.getElementById('email').value = window.user.email;
	}
	const form = document.getElementById('settings-form');
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
	
		const formData = new FormData(form);
		
		const oldPassword = document.getElementById('old_password').value;
		const newPassword1 = document.getElementById('new_password1').value;
		const newPassword2 = document.getElementById('new_password2').value;
		
		if (oldPassword || newPassword1 || newPassword2) {
			if (newPassword1) formData.set('password', newPassword1);
			
			if (!oldPassword || !newPassword1 || !newPassword2) {
				alert('Vous devez remplir tous les champs de mot de passe pour changer votre mot de passe.');
				return;
			}
			
			// Vérifier que les nouveaux mots de passe correspondent
			if (newPassword1 !== newPassword2) {
				alert('Les nouveaux mots de passe ne correspondent pas.');
				return;
			}
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
				alert('Paramètres mis à jour avec succès !');
				fetchUserInfo();
			} else {
				const errorData = await response.json();
				alert('Erreur lors de la mise à jour des paramètres : ' + 
                      (errorData.error ? (typeof errorData.error === 'object' ? JSON.stringify(errorData.error) : errorData.error) : 'Erreur inconnue'));
			}
		} catch (error) {
			console.error('Erreur lors de la requête :', error);
			alert('Une erreur est survenue. Veuillez réessayer plus tard.');
		}
	});
	if (window.user.intra_id)
		document.getElementById('login_42').style.display = 'none';
	else
		getClientAPI()
}
export { onLoad };