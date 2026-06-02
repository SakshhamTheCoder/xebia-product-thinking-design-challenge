import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, Field, Input, Alert, BrandMark } from '../components/ui';

export default function Register() {
  const { applyAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
  });
  const [pic, setPic] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  function onPicChange(e) {
    const file = e.target.files[0];
    setPic(file || null);
    setPreview(file ? URL.createObjectURL(file) : '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (pic) data.append('profilePic', pic);

      const res = await client.post('/auth/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      applyAuth(res.data.token, res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <BrandMark size="md" className="mb-3" />
        <h1 className="text-xl font-semibold text-emerald-900">Start your journey</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a learner account and earn your first XP today.
        </p>
      </div>
      <Card className="w-full p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert kind="error">{error}</Alert>}

          <Field label="Username" error={fieldErrors.username}>
            <Input
              name="username"
              value={form.username}
              onChange={update}
              placeholder="jane_doe"
            />
          </Field>

          <Field label="Email" error={fieldErrors.email}>
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Phone" error={fieldErrors.phone}>
            <Input
              name="phone"
              value={form.phone}
              onChange={update}
              placeholder="10-digit number"
            />
          </Field>

          <Field label="Password" error={fieldErrors.password}>
            <Input
              type="password"
              name="password"
              value={form.password}
              onChange={update}
              placeholder="Min 6 chars, a letter and a number"
            />
          </Field>

          <Field label="Profile picture (optional)">
            <div className="flex items-center gap-3">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">
                  —
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={onPicChange}
                className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-emerald-800 hover:file:bg-slate-50"
              />
            </div>
          </Field>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-600 underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
