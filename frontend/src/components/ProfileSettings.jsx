import { useState } from 'react';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Modal, Field, Input, Button, Alert, Avatar } from './ui';

export default function ProfileSettings({ open, onClose }) {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('profile');

  return (
    <Modal open={open} onClose={onClose} title="Account settings">
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        <Tab active={tab === 'profile'} onClick={() => setTab('profile')}>
          Profile
        </Tab>
        <Tab active={tab === 'password'} onClick={() => setTab('password')}>
          Password
        </Tab>
      </div>

      {tab === 'profile' ? (
        <EditProfileForm
          user={user}
          onSaved={(updated) => {
            setUser(updated);
            onClose();
          }}
        />
      ) : (
        <ChangePasswordForm onSaved={onClose} />
      )}
    </Modal>
  );
}

function Tab({ active, children, ...props }) {
  return (
    <button
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-emerald-600 text-emerald-700'
          : 'border-transparent text-slate-500 hover:text-emerald-800'
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

function EditProfileForm({ user, onSaved }) {
  const [form, setForm] = useState({ username: user.username, phone: user.phone });
  const [pic, setPic] = useState(null);
  const [preview, setPreview] = useState(user.profilePic || '');
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
    if (file) setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('username', form.username);
      data.append('phone', form.phone);
      if (pic) data.append('profilePic', pic);
      const res = await client.patch('/users/me', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSaved(res.data.user);
    } catch (err) {
      setError(err.message);
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert kind="error">{error}</Alert>}

      <div className="flex items-center gap-3">
        <Avatar src={preview} name={form.username} size="md" />
        <input
          type="file"
          accept="image/*"
          onChange={onPicChange}
          className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-emerald-800 hover:file:bg-slate-50"
        />
      </div>

      <Field label="Username" error={fieldErrors.username}>
        <Input name="username" value={form.username} onChange={update} />
      </Field>
      <Field label="Phone" error={fieldErrors.phone}>
        <Input name="phone" value={form.phone} onChange={update} />
      </Field>
      <Field label="Email">
        <Input value={user.email} disabled className="bg-slate-50 text-slate-500" />
      </Field>
      <p className="-mt-2 text-xs text-slate-400">Email can&apos;t be changed.</p>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}

function ChangePasswordForm({ onSaved }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      await client.patch('/users/me/password', form);
      setSuccess('Password changed.');
      setForm({ currentPassword: '', newPassword: '' });
      setTimeout(onSaved, 700);
    } catch (err) {
      setError(err.message);
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert kind="error">{error}</Alert>}
      {success && <Alert kind="success">{success}</Alert>}

      <Field label="Current password" error={fieldErrors.currentPassword}>
        <Input
          type="password"
          name="currentPassword"
          value={form.currentPassword}
          onChange={update}
        />
      </Field>
      <Field label="New password" error={fieldErrors.newPassword}>
        <Input
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={update}
          placeholder="Min 6 chars, a letter and a number"
        />
      </Field>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Saving…' : 'Change password'}
      </Button>
    </form>
  );
}
