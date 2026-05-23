export function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

export function showResponse(data) {
  const response = document.getElementById('response');
  response.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}

export function setStatus(cardId, statusText, detailsText, statusClass) {
  const statusElement = document.getElementById(cardId);
  const card = statusElement.parentElement;
  const details = card.querySelector('.details');

  statusElement.textContent = statusText;
  details.textContent = detailsText;
  card.className = `status-card ${statusClass}`;
}

export function openLoginModal() {
  document.getElementById('loginModal').style.display = 'flex';
}

export function closeLoginModal() {
  document.getElementById('loginModal').style.display = 'none';
}

export function toggleProtectedButtons(enabled) {
  const ids = ['companiesBtn', 'accountsBtn', 'journalBtn', 'trialBtn', 'logoutBtn'];
  for (const id of ids) {
    document.getElementById(id).style.display = enabled ? 'inline-block' : 'none';
  }
}
