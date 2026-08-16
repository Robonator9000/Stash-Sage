import { useState, useEffect } from 'react';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { Modal, Stack, Text, TextInput, Button, Alert } from '@mantine/core';

interface ResetPasswordModalProps {
  isDark: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export function ResetPasswordModal({ isDark, onClose, initialEmail = '' }: ResetPasswordModalProps) {
  const { isVisible, handleClose } = useModalAnimation(onClose);
  const { error, resetPasswordForEmail, clearError } = useAuth();
  const { settings } = useSettings();
  const lang = settings.language;
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // A stale sign-in error must not greet the user in the reset flow.
  useEffect(() => { clearError(); return clearError; }, [clearError]);

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
      title={<Text fw={700} size="lg">{t('resetPasswordTitle', lang)}</Text>}
    >
      <Stack gap="md">
        {sent ? (
          <Alert color="green" variant="light">
            {t('resetLinkSent', lang)}
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
                <label htmlFor="reset-email" className="sr-only">{t('emailLabel', lang)}</label>
                <TextInput
                  id="reset-email"
                  name="email"
                  type="email"
                  placeholder={t('resetEmailPlaceholder', lang)}
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
                  styles={{ root: { background: 'linear-gradient(to right, var(--mantine-color-cyan-7), var(--mantine-color-emerald-7))' } }}
                >
                  {submitting ? t('sending', lang) : t('sendResetLink', lang)}
                </Button>
              </Stack>
            </form>
          </>
        )}

        <Button variant="subtle" fullWidth c={isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)'} styles={{ root: { '&:hover': { color: 'var(--mantine-color-cyan-6)' } } }} onClick={handleClose}>
          {t('backToSignIn', lang)}
        </Button>
      </Stack>
    </Modal>
  );
}
