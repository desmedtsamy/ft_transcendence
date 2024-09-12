async function homePage() {
	const response = await fetch('/templates/home.html');
    return await response.text();
}

async function scoreboardPage() {
	const response = await fetch('/templates/scoreboard.html');   
    return await response.text();
}

async function searchPage() {
	const response = await fetch('/templates/search.html');
    return await response.text();
}

async function tournamentPage() {
	const response = await fetch('/templates/tournament.html');
    return await response.text();
}

async function loginPage() {
	const response = await fetch('/templates/login.html');
    return await response.text();
}

async function profilePage() {
	const response = await fetch('/templates/profile.html');
    return await response.text();
}

async function settingsPage() {
	const response = await fetch('/templates/settings.html');
    return await response.text();
}

async function adminPage() {
	const response = await fetch('/templates/admin.html');
    return await response.text();
}