const routes = {
    '/': homePage,
    '/test/scoreboard': scoreboardPage,
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
	console.log(path + " render");
    const app = document.getElementById('app'); 
    if (!app) {
        console.error("Element with id 'app' not found in the DOM.");
        return;
    }

    path = path || '/'; 
	
    if (routes[path]) {
		console.log('Rendering page:', path, " ", routes[path]);
        try {
            const content = await routes[path](); // Attend le chargement du contenu HTML
			console.log ('Content:', content);
            app.innerHTML = content;
            if (path === '/login') {
                setupLoginForm(); 
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

// Fonction setupLoginForm (à adapter selon tes besoins)
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    // ... (Logique de gestion du formulaire de connexion)
}