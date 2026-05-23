import { API } from '../config.js';
import { apiRequest } from '../api/client.js';
import { showResponse, showToast } from './ui.js';

export async function getCompanies() {
  try {
    showResponse('Fetching companies...');
    const data = await apiRequest(API.companies);
    showResponse(data);
    showToast(`Found ${data.length} companies`, 'success');
  } catch (error) {
    showResponse(`Error fetching companies: ${error.message}`);
    showToast(error.message, 'error');
  }
}

export async function getAccounts() {
  try {
    showResponse('Fetching accounts...');
    const data = await apiRequest(API.accounts);
    showResponse(data);
    showToast(`Found ${data.length} accounts`, 'success');
  } catch (error) {
    showResponse(`Error fetching accounts: ${error.message}`);
    showToast(error.message, 'error');
  }
}

export async function getJournalEntries() {
  try {
    showResponse('Fetching journal entries...');
    const data = await apiRequest(API.journalEntries);
    showResponse(data);
    showToast(`Found ${data.length} journal entries`, 'success');
  } catch (error) {
    showResponse(`Error fetching journal entries: ${error.message}`);
    showToast(error.message, 'error');
  }
}

export async function getTrialBalance() {
  try {
    showResponse('Fetching trial balance...');
    const data = await apiRequest(API.trialBalance);
    showResponse(data);
    showToast(`Trial balance loaded (${data.length} accounts)`, 'success');
  } catch (error) {
    showResponse(`Error fetching trial balance: ${error.message}`);
    showToast(error.message, 'error');
  }
}
