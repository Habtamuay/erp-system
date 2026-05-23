import { API } from '../config.js';
import { apiRequest } from '../api/client.js';
import { state, setAuth } from '../state.js';
import { closeLoginModal, setStatus, showResponse, showToast, toggleProtectedButtons } from './ui.js';

export async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  showResponse('Logging in...');

  try {
    const data = await apiRequest(API.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setAuth(data.token, data.user);
    setStatus('authStatus', 'Logged in', `Welcome, ${data.user.name} (${data.user.role})`, 'success');
    toggleProtectedButtons(true);
    closeLoginModal();
    showResponse(data);
    showToast(`Login successful: ${data.user.name}`, 'success');
    return data;
  } catch (error) {
    setAuth(null, null);
    setStatus('authStatus', 'Not logged in', 'Please login to access features', 'warning');
    toggleProtectedButtons(false);
    showResponse(`Login failed: ${error.message}`);
    showToast(`Login failed: ${error.message}`, 'error');
    return null;
  }
}

export function logout() {
  setAuth(null, null);
  setStatus('authStatus', 'Not logged in', 'Please login to access features', 'warning');
  toggleProtectedButtons(false);
  showResponse('Logged out successfully');
  showToast('Logged out successfully', 'info');
}

export function restoreAuthState() {
  if (state.token && state.user) {
    setStatus('authStatus', 'Logged in', `Welcome, ${state.user.name} (${state.user.role})`, 'success');
    toggleProtectedButtons(true);
    return true;
  }

  setStatus('authStatus', 'Not logged in', 'Please login to access features', 'warning');
  toggleProtectedButtons(false);
  return false;
}
