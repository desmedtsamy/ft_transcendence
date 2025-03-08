function onLoad() {
	const form = document.getElementById('register-form');
	const messageDiv = document.getElementById('message');

	async function handleRegister(event) {
		event.preventDefault();
		const formData = new FormData(event.target);
		const data = {
			username: formData.get('username'),
			email: formData.get('email'),
			password: formData.get('password'),
		};

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
				alert("Bonjour " + user.username);
				handleUserAuthenticated(user);
				navigateTo('/');
			} else {
				const errorData = await response.json();
				console.log(errorData);
				if (errorData.non_field_errors) {
					alert(errorData.non_field_errors.join('\n'), 'error');
				} else {
					alert(errorData, 'error');
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