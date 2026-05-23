import { API } from '../config.js';
import { apiRequest } from '../api/client.js';
import { setStatus, showResponse, showToast } from './ui.js';

export async function checkHealth() {
  showResponse('Checking health...');
  try {
    const data = await apiRequest(API.health);
    setStatus('apiStatus', 'Connected', 'API is responding normally', 'success');
    showResponse(data);
    await checkDatabase();
    showToast('API health check passed', 'success');
  } catch (error) {
    setStatus('apiStatus', 'Error', error.message, 'error');
    showResponse(`Health check failed: ${error.message}`);
    showToast('API health check failed', 'error');
  }
}

export async function checkDatabase() {
  try {
    const data = await apiRequest(API.dbStatus);
    if (data.connected) {
      setStatus(
        'dbStatus',
        'Connected',
        `${data.companies || 0} companies, ${data.users || 0} users, ${data.accounts || 0} accounts`,
        'success',
      );
    } else {
      setStatus('dbStatus', 'Error', data.error || 'Database connection error', 'error');
    }
  } catch (error) {
    setStatus('dbStatus', 'Error', error.message, 'error');
  }
}
