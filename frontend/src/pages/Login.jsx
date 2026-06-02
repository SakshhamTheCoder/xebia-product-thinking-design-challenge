import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { homeFor } from '../lib/roles';
import { Button, Card, Field, Input, Alert, BrandMark } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-center px-6">
      <div className="mb-6 flex flex-col items-center text-center">
        <BrandMark size="md" className="mb-3" />
        <h1 className="text-xl font-semibold text-emerald-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to keep leveling up your skills.
        </p>
      </div>
      <Card className="w-full p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert kind="error">{error}</Alert>}

          <Field label="Email">
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              placeholder="you@example.com"
              required
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              name="password"
              value={form.password}
              onChange={update}
              placeholder="••••••••"
              required
            />
          </Field>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-medium text-emerald-600 underline">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
