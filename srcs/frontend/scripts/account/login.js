async function LoginForm(event) {
	const username = document.getElementById('username_input').value.trim();
    const password = document.getElementById('password').value;
	
    event.preventDefault();

    try {
        const csrftoken = getCookie('csrftoken');
        const response = await fetch('/api/account/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
						username:username,
						password:password,
			 }),
            credentials: 'include',
        });
		if (response.ok) {
			const user = await response.json();
			alert("Bonjour " + user.username);
			handleUserAuthenticated(user);
			navigateTo('/');
		} else {
			const result = await response.json();
			alert("nom d'utilisateur ou mot de passe incorrect ou utilisateur déjà connecté");
		}

    } catch (error) {
		alert(error || 'Login failed');
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
			const redirect_uri = response_json.redirect_uri;
			link.href = `https://api.intra.42.fr/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code`;
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
	getClientAPI();
}

export {onLoad};
window.LoginForm = LoginForm;