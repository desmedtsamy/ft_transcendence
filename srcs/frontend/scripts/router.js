const routes = {
    '/': homePage,
    '/scoreboard': scoreboardPage,
    '/account/search': searchPage,
    '/tournament': tournamentPage,
    '/login': loginPage,
    '/profile': profilePage,
    '/settings': settingsPage,
    '/admin': adminPage
};

function navigateTo(path) {
    const currentPath = window.location.pathname;
    const absolutePath = path.startsWith('/') 
        ? path
        : (currentPath.endsWith('/') ? currentPath : currentPath + '/') + path;

    window.history.pushState({}, '', absolutePath);
    render(absolutePath);
}

async function render(path) {
	const app = document.getElementById('app'); 
    if (!app) {
        console.error("Element with id 'app' not found in the DOM.");
        return;
    }

    path = path || '/'; 

    if (routes[path]) {
		try {
            const pageData = await routes[path]();
			app.innerHTML = pageData.html;
			// Charger dynamiquement le script si nécessaire
            if (pageData.script) { 
                const script = document.createElement('script');
                script.src = pageData.script;
                script.async = true; // Charger le script de manière asynchrone
                script.addEventListener('load', () => {
					if (typeof window.onLoad === 'function') {
						window.onLoad();
					} else {
						// DEBUG
						console.log('No onLoad function found in the global scope for path:', path);
					}
				});
			
				document.head.appendChild(script);
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