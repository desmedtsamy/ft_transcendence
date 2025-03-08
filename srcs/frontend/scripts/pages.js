
async function callbackPage() {
	const response = await fetch('/templates/login.html');
	const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/login.js",
		};
}

async function registerPage() {
	if (window.user !== null) {
		return homePage();
	}
	const response = await fetch('/templates/register.html');
	const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/register.js",
		};
}

async function loginPage() {
	if (window.user !== null) {
		return homePage();
	}
	const response = await fetch('/templates/login.html');
	const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/login.js",
		};
}
async function matchmakingPage() {
	if (window.user === null) {
		alert("You must be logged in to access this page.", "error");
		return homePage();
	}
	const response = await fetch('/templates/matchmaking.html');
	const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/matchmaking.js",
		};
}
async function pongPage() {
	if (window.user === null) {
		alert("You must be logged in to access this page.", "error");
		return homePage();
	}
	const response = await fetch('/templates/pong.html');
	const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/pong.js",
	};
}

async function homePage() {
	if ( window.selected_game === "tictactoe") {
		const response = await fetch('/templates/home_tictactoe.html');
		const htmlContent = await response.text();
		return {
			html: htmlContent,
			script: "/scripts/home_tictactoe.js",
		};
	}
	const response = await fetch('/templates/home_pong.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/home_pong.js",
	};
}

async function scoreboardPage() {
	// if (window.user === null) {
	// 	alert("You must be logged in to access this page.", "error");
	// 	return homePage();
	// }
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

async function tournamentsPage() {
	// if (window.user === null) {
	// 	alert("You must be logged in to access this page.", "error");
	// 	return homePage();
	// }
	const response = await fetch('/templates/tournaments.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/tournaments/tournaments.js",
	};
}
async function profilePage() {
	if (window.user === null) {
		alert("You must be logged in to access this page.", "error");
		return homePage();
	}
	const response = await fetch('/templates/profile.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/profile.js",
	};
}

async function settingsPage() {
	if (window.user === null) {
		alert("You must be logged in to access this page.", "error");
		return homePage();
	}
	const response = await fetch('/templates/settings.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/settings.js",
	};
}