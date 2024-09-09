document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/account/settings')  // URL de ton API Django
        .then(response => response.json())
        .then(data => {
            const appDiv = document.getElementById('app');
            data.forEach(user => {
                const userElement = document.createElement('div');
                userElement.textContent = `User: ${user.username}`;
                appDiv.appendChild(userElement);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});

console.log('Hello, World!');  // Ceci est un commentaire