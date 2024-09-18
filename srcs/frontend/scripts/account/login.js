
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
			alert("Bonjour " + user.username);
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
			link.href = "https://api.intra.42.fr/oauth/authorize?client_id=" + client_id + "&redirect_uri=http%3A%2F%2Flocalhost%2F42callback&response_type=code";
		} else {
			link.style.display = 'none';
			const result = await response.json();
			console.log(result.detail || 'Login failed');
		}

    } catch (error) {
        console.error('Error:', error);
    }
}

function onLoad() {
	getClientAPI();
}
