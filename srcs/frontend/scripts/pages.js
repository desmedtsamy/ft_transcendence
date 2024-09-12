function homePage() {
    return `<h1>Home Page</h1><p>Welcome to the home page!</p>`;
}

function scoreboardPage() {
    return `<h1>Classement</h1><p>This is the scoreboard page!</p>`; 
}

function searchPage() {
    return `<h1>Rechercher</h1><p>This is the search page!</p>`;
}

function tournamentPage() {
    return `<h1>Tournois</h1><p>This is the tournament page!</p>`;
}

function loginPage() {
    return `
        <h1>Login Page</h1>
        <form id="login-form">
            <input type="text" id="username" placeholder="Username" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
        <div id="user-info"></div>
    `;
}

function profilePage() {
    return `<h1>Profile</h1><p>Welcome to your profile!</p>`;
}

function settingsPage() {
    return `<h1>Settings</h1><p>Adjust your settings here!</p>`;
}

function adminPage() {
    return `<h1>Admin</h1><p>Admin panel access</p>`;
}
function homePage() {
    return `<h1>Home Page</h1><p>Welcome to the home page!</p>`;
}

function scoreboardPage() {
    return `<h1>Classement</h1><p>This is the scoreboard page!</p>`; 
}

function searchPage() {
    return `<h1>Rechercher</h1><p>This is the search page!</p>`;
}

async function tournamentPage() {
    const response = await fetch('tournament.html');
    return await response.text();
}

function loginPage() {
    return `
        <h1>Login Page</h1>
        <form id="login-form">
            <input type="text" id="username" placeholder="Username" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
        <div id="user-info"></div>
    `;
}

function profilePage() {
    return `<h1>Profile</h1><p>Welcome to your profile!</p>`;
}

function settingsPage() {
    return `<h1>Settings</h1><p>Adjust your settings here!</p>`;
}

function adminPage() {
    return `<h1>Admin</h1><p>Admin panel access</p>`;
}