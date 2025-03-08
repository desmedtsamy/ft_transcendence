
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
			link.href = "https://api.intra.42.fr/oauth/authorize?client_id=" + client_id + "&redirect_uri=http%3A%2F%2Flocalhost%3A8042%2F42sync&response_type=code";

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
	if (window.user === undefined) {
		console.log('User not authenticated');
	}
	else {
		document.getElementById('username_input').value = window.user.username;
		document.getElementById('email').value = window.user.email;
	}
	const form = document.getElementById('settings-form');
	
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
	
		const formData = new FormData(form);
	
	
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
				handleUserAuthenticated(userData);
			} else {
				const errorData = await response.json();
				alert('Erreur lors de la mise à jour des paramètres : ' + errorData.error);
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