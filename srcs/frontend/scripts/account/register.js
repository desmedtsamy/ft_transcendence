// Add necessary imports and functions
function getCookie(name) {
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

function handleUserAuthenticated(user) {
	window.user = user;
	document.getElementById('login-link').style.display = 'none';
	document.getElementById('profile-menu').style.display = 'block';
	document.getElementById('username').textContent = user.username;
	if (user.profile_picture) {
		document.getElementById('profile-pic').src = user.profile_picture;
	}
	if (user.is_staff) {
		document.getElementById('admin-link').style.display = 'block';
	}
}

function onLoad() {
	const form = document.getElementById('register-form');

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