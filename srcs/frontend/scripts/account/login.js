
async function LoginForm() {
	const username = document.getElementById('username_form').value;
    const password = document.getElementById('password').value;
	
    event.preventDefault();

    try {
        const csrftoken = getCookie('csrftoken');
        const response = await fetch('/api/account/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrftoken,
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
            credentials: 'include',
        });
		if (response.ok) {
			const user = await response.json();
			handleUserAuthenticated(user);
			navigateTo('/');
		} else {
			const result = await response.json();
			console.log(result.detail || 'Login failed');
		}

    } catch (error) {
        console.error('Error:', error);
    }
}

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

function onLoad() {
}
