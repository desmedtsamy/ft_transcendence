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
    window.history.pushState({}, path, window.location.origin + path);
    render(path);
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
            const content = await routes[path](); // Attend le chargement du contenu HTML
            app.innerHTML = content;
            if (path === '/login') {
                setupLoginForm(); 
            }
        } catch (error) {
            console.error('Error loading page content:', error);
            app.innerHTML = '<h1>Error loading page</h1>'; 
        }
    } else {
        app.innerHTML = '<h1>404 - Page Not Found</h1>';
    }
}

// Fonction setupLoginForm (à adapter selon tes besoins)
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    // ... (Logique de gestion du formulaire de connexion)
}