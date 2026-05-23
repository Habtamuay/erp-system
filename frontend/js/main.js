import { login, logout, restoreAuthState } from './modules/auth.js';
import { checkHealth } from './modules/status.js';
import { getCompanies, getAccounts, getJournalEntries, getTrialBalance } from './modules/accounting.js';
import { openLoginModal, closeLoginModal } from './modules/ui.js';

window.checkHealth = checkHealth;
window.showLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.login = login;
window.logout = logout;
window.getCompanies = getCompanies;
window.getAccounts = getAccounts;
window.getJournalEntries = getJournalEntries;
window.getTrialBalance = getTrialBalance;

window.onload = async () => {
  restoreAuthState();
  await checkHealth();
  if (restoreAuthState()) {
    await getCompanies();
  }
};
