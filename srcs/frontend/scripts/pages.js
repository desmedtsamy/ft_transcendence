
async function callbackPage() {
	const response = await fetch('/templates/login.html');
	const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/login.js",
		};
}

async function registerPage() {
	const response = await fetch('/templates/register.html');
	const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/register.js",
		};
}
async function loginPage() {
	const response = await fetch('/templates/login.html');
	const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/login.js",
		};
}

async function homePage() {
	const response = await fetch('/templates/home.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "",
	};
}

async function scoreboardPage() {
	const response = await fetch('/templates/scoreboard.html');   
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/scoreboard.js",
	};
}

async function searchPage() {
	if (window.user === null) {
		alert("You must be logged in to access this page.", "error");
		return homePage();
	}
	const response = await fetch('/templates/search.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/search.js",
	};
}

async function tournamentPage() {
	const response = await fetch('/templates/tournament.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "",
	};
}
async function profilePage() {
	const response = await fetch('/templates/profile.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/profile.js",
	};
}

async function settingsPage() {
	const response = await fetch('/templates/settings.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/settings.js",
	};
}

async function adminPage() {
	const response = await fetch('/templates/admin.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "",
	};
}