let loadedScript = null;

const routes = {
	'/': homePage,
	'/scoreboard': scoreboardPage,
	'/search': searchPage,
	'/tournaments': tournamentsPage,
	'/login': loginPage,
	'/register': registerPage,
	'/profile': profilePage,
	'/settings': settingsPage,
	'/notification': notificationPage,
	'/pong': pongPage,
};

function callback() {
	const urlParams = new URLSearchParams(window.location.search);
	const code = urlParams.get('code');
	const csrftoken = getCookie('csrftoken');
	fetch('/api/account/42callback/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrftoken,
		},
		body: JSON.stringify({ code }),
	})
		.then(async (response) => {
			if (response.ok) {
				const json = await response.json();
				const user = json.user;
				alert("Bonjour " + user.username);
				handleUserAuthenticated(user);
				navigateTo('/');
			} else {
				console.error("Erreur lors de l'authentification 42:", response.statusText);
			}
		})
		.catch(error => {
			console.error("Erreur lors de la requête au backend :", error);
		});
}

function navigateTo(path) {
	const currentPath = window.location.pathname;
	const absolutePath = path.startsWith('/')
		? path
		: (currentPath.endsWith('/') ? currentPath : currentPath + '/') + path;

	if (absolutePath === '/42callback') {
		callback();
	}
	else {
		
		window.history.pushState({}, '', absolutePath);
		render(absolutePath);
	}
}

async function render(path) {
	const app = document.getElementById('app');
	if (!app) {
		console.error("Element with id 'app' not found in the DOM.");
		return;
	}

	path = path || '/';
	while (routes[path] === undefined && path.length > 1) {
		path = path.slice(0, path.lastIndexOf('/'));
	}
	if (routes[path]) {
		try {
			const pageData = await routes[path]();
			app.innerHTML = pageData.html;
			if (pageData.script) {
				try {
					if (loadedScript) {
						if (loadedScript.onUnload && typeof loadedScript.onUnload === 'function') {
							loadedScript.onUnload();
						}
						loadedScript = null;
					}
					loadedScript = await import(pageData.script);
					if (loadedScript.onLoad && typeof loadedScript.onLoad === 'function') {
						loadedScript.onLoad();
					}
				} catch (error) {
					console.error('Erreur lors du chargement du module :', error);
				}
			}
		} catch (error) {
			console.error('Error loading page content:', error);
			app.innerHTML = '<h1>Error loading page</h1>';
		}
	} else {
		console.error('Page not found:', path);
		app.innerHTML = '<h1>404 - Page Not Found</h1>';
	}
}