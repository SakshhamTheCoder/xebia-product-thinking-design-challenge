import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import { Button, Modal, Alert, Card } from './ui';

export default function DeleteAccount() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    setError('');
    try {
      await client.delete('/users/me');
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Card className="mt-6 border-red-200 p-6">
      <h2 className="text-sm font-semibold text-red-700">Danger zone</h2>
      <p className="mt-1 text-sm text-slate-500">
        Permanently delete your account and progress. This can&apos;t be undone.
      </p>
      <div className="mt-4">
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete account
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Delete your account?">
        <div className="space-y-4">
          {error && <Alert kind="error">{error}</Alert>}
          <p className="text-sm text-slate-600">
            This permanently removes your account, XP, and submissions, then logs
            you out. Are you sure?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={busy} onClick={handleDelete}>
              {busy ? 'Deleting…' : 'Delete account'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
