export const recoveryRedirectUrl = 'https://wingscorporate.github.io/Hrms/reset-password.html';

export function recoveryLinkState(hash: string, search: string) {
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  const query = new URLSearchParams(search);
  return {
    hasError: fragment.has('error') || query.has('error') || fragment.has('error_code') || query.has('error_code'),
    hasRecoverySession: fragment.get('type') === 'recovery' && !!fragment.get('access_token') && !!fragment.get('refresh_token'),
  };
}

export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 12) return 'Use at least 12 characters for your new password.';
  if (password !== confirmation) return 'The passwords do not match.';
  return '';
}
