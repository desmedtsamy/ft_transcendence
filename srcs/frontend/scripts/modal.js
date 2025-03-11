window.createModal = createModal;
window.closeModal = closeModal;

let modalInstance = null;

export function createModal() {
	if (!modalInstance) {
		const modalElement = document.getElementById('Modal');
		modalInstance = new bootstrap.Modal(modalElement, {
			backdrop: 'static',
			keyboard: false
		});
	}
	modalInstance.show();
}

export function closeModal() {
	if (modalInstance) {
		modalInstance.hide();
	}
}