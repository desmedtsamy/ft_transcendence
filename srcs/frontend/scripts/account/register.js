
function onLoad() {
	const form = document.getElementById('register-form');
	const messageDiv = document.getElementById('message');

	form.addEventListener('submit', async (event) => {
		event.preventDefault();

		const formData = new FormData(form);
		const data = {};
		for (const [key, value] of formData.entries()) {
			data[key] = value;
		}
		try {
			const response = await fetch('/api/account/register/',
				{
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
				alert('Erreur lors de l\'inscription : ' + errorData.error);
			}
		} catch (error) {
			console.error('Erreur lors de la requête :', error);
			alert('Une erreur est survenue. Veuillez réessayer plus tard.');
		}
	});
}
export { onLoad };