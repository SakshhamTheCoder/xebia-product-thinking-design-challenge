export function homeFor(role) {
  if (role === 'admin') return '/admin';
  if (role === 'mentor') return '/mentor';
  return '/dashboard';
}
