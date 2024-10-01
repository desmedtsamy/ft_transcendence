
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
				alert('Erreur lors de la mise à jour des paramètres : ' + JSON.stringify(errorData));
			}
		} catch (error) {
			console.error('Erreur lors de la requête :', error);
			alert('Une erreur est survenue. Veuillez réessayer plus tard.');
		}
	});
}
export { onLoad };