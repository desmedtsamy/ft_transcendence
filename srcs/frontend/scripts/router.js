let loadedScript = null;

const routes = {
	'/': homePage,
	'/home': homePage,
	'/scoreboard': scoreboardPage,
	'/search': searchPage,
	'/tournaments': tournamentsPage,
	'/login': loginPage,
	'/register': registerPage,
	'/profile': profilePage,
	'/settings': settingsPage,
	'/matchmaking': matchmakingPage,
	'/pong': pongPage,
	'/tictactoe': tictactoePage,
	'/friends': friendsPage,
};

function sync_42() {
	const urlParams = new URLSearchParams(window.location.search);
	const code = urlParams.get('code');
	const csrftoken = getCookie('csrftoken');
	fetch('/api/account/42sync/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrftoken,
		},
		body: JSON.stringify({ code }),
	})
		.then(async (response) => {
			if (response.ok) {
				const data = await response.json();
				const user = data.user;
				alert("compte synchronisé avec succès");
			} else {	
				const errorData = await response.json();
				alert('Erreur : ' + errorData.error, "error");
			}
		})
		.catch(error => {
			alert('Erreur : ' + errorData.error, "error");
		});
		navigateTo('/');
}


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
				alert("Bienvenue " + user.username);
				handleUserAuthenticated(user);
				navigateTo('/');
			} else {
				console.error("Erreur lors de la synchronisation 42:", response.statusText);
				
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
	else if (absolutePath === '/42sync') {
		sync_42();
	} else {
		
		window.history.pushState({}, '', absolutePath);
		render(absolutePath);
	}
}

async function render(path) {
	try {
		if (loadedScript && loadedScript.onUnload && typeof loadedScript.onUnload === 'function') {
			loadedScript.onUnload();
			loadedScript = null;
		}

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
			const pageData = await routes[path]();
			app.innerHTML = pageData.html;
			if (pageData.script) {
				try {
					loadedScript = await import(pageData.script);
					if (loadedScript.onLoad && typeof loadedScript.onLoad === 'function') {
						loadedScript.onLoad();
					}
				} catch (error) {
					console.error('Error loading script:', error);
				}
			}
		} else {
			console.error('Page not found:', path);
			app.innerHTML = '<h1>404 - Page Not Found</h1>';
		}
	} catch (error) {
		console.error('Error rendering page:', error);
	}
}

