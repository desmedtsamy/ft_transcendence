window.createModal = createModal;
window.closeModal = closeModal;

export function createModal() {
	const modalElement = document.getElementById('Modal');
	if (modalElement) {
		if (modalElement.bootstrapModal) {
			// Use Bootstrap's modal method if available
			modalElement.bootstrapModal.show();
		} else {
			// Fallback to direct style manipulation
			modalElement.style.display = 'flex';
		}
	}
}

export function closeModal() {
	const modalElement = document.getElementById('Modal');
	if (modalElement) {
		if (modalElement.bootstrapModal) {
			// Use Bootstrap's modal method if available
			modalElement.bootstrapModal.hide();
		} else {
			// Fallback to direct style manipulation
			modalElement.style.display = 'none';
		}
	}
}