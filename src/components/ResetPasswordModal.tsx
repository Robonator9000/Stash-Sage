import { useState } from 'react';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { useAuth } from '../contexts/AuthContext';
import { Modal, Stack, Text, TextInput, Button, Alert } from '@mantine/core';

interface ResetPasswordModalProps {
  isDark: boolean;
  onClose: () => void;
}

export function ResetPasswordModal({ isDark, onClose }: ResetPasswordModalProps) {
  const { isVisible, handleClose } = useModalAnimation(onClose);
  const { error, resetPasswordForEmail, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resetPasswordForEmail(email);
      setSent(true);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={isVisible}
      onClose={handleClose}
      size="sm"
      centered
      radius="lg"
      closeOnEscape={false}
      title={<Text fw={700} size="lg">Reset Password</Text>}
    >
      <Stack gap="md">
        {sent ? (
          <Alert color="green" variant="light">
            Check your email for the password reset link.
          </Alert>
        ) : (
          <>
            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <label htmlFor="reset-email" className="sr-only">Email</label>
                <TextInput
                  id="reset-email"
                  name="email"
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => { setEmail(e.currentTarget.value); clearError(); }}
                  required
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  fullWidth
                  loading={submitting}
                  styles={{ root: { background: 'linear-gradient(to right, var(--mantine-color-cyan-6), var(--mantine-color-emerald-5))' } }}
                >
                  {submitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </Stack>
            </form>
          </>
        )}

        <Button variant="subtle" fullWidth c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)'} styles={{ root: { '&:hover': { color: 'var(--mantine-color-cyan-6)' } } }} onClick={handleClose}>
          Back to Sign In
        </Button>
      </Stack>
    </Modal>
  );
}
