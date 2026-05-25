export function clearAuthSession() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('token');
  localStorage.removeItem('user_name');
  localStorage.removeItem('role');
}

export function redirectToLogin(nextPath?: string) {
  if (typeof window === 'undefined') return;

  clearAuthSession();

  const target = nextPath
    ? `/login?next=${encodeURIComponent(nextPath)}`
    : '/login';

  window.location.replace(target);
}