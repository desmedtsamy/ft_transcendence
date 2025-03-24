async function callbackPage() {
	const response = await fetch('/templates/account/login.html');
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
	const response = await fetch('/templates/account/register.html');
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
	const response = await fetch('/templates/account/login.html');
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
	const response = await fetch('/templates/game/pong.html');
	const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/game/pong.js",
	};
}
async function tictactoePage() {
	if (window.user === null) {
		alert("You must be logged in to access this page.", "error");
		return homePage();
	}
	const response = await fetch('/templates/game/tictactoe.html');
	const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/game/tictactoe.js",
	};
}

async function homePage() {
	if ( window.selected_game === "tictactoe") {
		const response = await fetch('/templates/home/tictactoe.html');
		const htmlContent = await response.text();
		return {
			html: htmlContent,
			script: "/scripts/home/tictactoe.js",
		};
	}
	const response = await fetch('/templates/home/pong.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/home/pong.js",
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
	const response = await fetch('/templates/account/search.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/search.js",
	};
}

async function friendsPage() {
	const response = await fetch('/templates/account/friends.html');
    const htmlContent = await response.text();
	const pageData = {
		html: htmlContent,
		script: "/scripts/account/friends.js",
	};

	// After the page loads, show/hide appropriate content based on auth status
	setTimeout(() => {
		const loginPrompt = document.getElementById('login-prompt');
		const friendsContent = document.getElementById('friends-content');
		if (window.user === null) {
			loginPrompt.style.display = 'block';
			friendsContent.style.display = 'none';
		} else {
			loginPrompt.style.display = 'none';
			friendsContent.style.display = 'block';
		}
	}, 0);

	return pageData;
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
	const response = await fetch('/templates/account/profile.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/profile/profile.js",
	};
}

async function settingsPage() {
	if (window.user === null) {
		alert("You must be logged in to access this page.", "error");
		return homePage();
	}
	const response = await fetch('/templates/account/settings.html');
    const htmlContent = await response.text();
	return {
		html: htmlContent,
		script: "/scripts/account/settings.js",
	};
}