async function homePage() {
	const response = await fetch('/home.html');
    return await response.text();
}

async function scoreboardPage() {
	const response = await fetch('/scoreboard.html');
    return await response.text();
}

async function searchPage() {
	const response = await fetch('/search.html');
    return await response.text();
}

async function tournamentPage() {
	const response = await fetch('/tournament.html');
    return await response.text();
}

async function loginPage() {
	const response = await fetch('/login.html');
    return await response.text();
}

async function profilePage() {
	const response = await fetch('/profile.html');
    return await response.text();
}

async function settingsPage() {
	const response = await fetch('/settings.html');
    return await response.text();
}

async function adminPage() {
	const response = await fetch('/admin.html');
    return await response.text();
}