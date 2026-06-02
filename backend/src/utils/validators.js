const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const checks = {
  username(v, e) {
    const s = (v ?? '').trim();
    if (!s) e.username = 'Username is required';
    else if (s.length < 3) e.username = 'Username must be at least 3 characters';
    else if (s.length > 30) e.username = 'Username must be at most 30 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(s))
      e.username = 'Use only letters, numbers, and underscores';
  },
  email(v, e) {
    const s = (v ?? '').trim();
    if (!s) e.email = 'Email is required';
    else if (!EMAIL_RE.test(s)) e.email = 'Enter a valid email address';
  },
  phone(v, e) {
    const s = (v ?? '').trim();
    if (!s) e.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(s)) e.phone = 'Phone must be exactly 10 digits';
  },
  password(v, e) {
    const s = v ?? '';
    if (!s) e.password = 'Password is required';
    else if (s.length < 6) e.password = 'Password must be at least 6 characters';
    else if (!/[a-zA-Z]/.test(s) || !/[0-9]/.test(s))
      e.password = 'Password must include a letter and a number';
  },
};

export function validate(data, fields) {
  const errors = {};
  fields.forEach((f) => checks[f](data[f], errors));
  return errors;
}
