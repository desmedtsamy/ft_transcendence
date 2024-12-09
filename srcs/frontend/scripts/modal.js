
window.createModal = createModal;
window.closeModal = closeModal;

window.onclick = function(event) {
	const modal = document.getElementById('Modal');
	if (event.target == modal) {
		modal.style.display = 'none';
	}
}

export function createModal() {
	document.getElementById('Modal').style.display = 'flex';
}

export function closeModal() {
	document.getElementById('Modal').style.display = 'none';
}