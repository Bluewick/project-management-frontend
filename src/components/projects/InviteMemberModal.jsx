import { useState } from 'react';
import { Check, Copy, MailPlus } from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Input } from '../common/Input.jsx';
import { Select } from '../common/Select.jsx';
import { Button } from '../common/Button.jsx';
import { ErrorBanner } from '../feedback/ErrorBanner.jsx';
import { memberService } from '../../services/member.service.js';
import { useToast } from '../../hooks/useToast.js';
import { PROJECT_ROLES } from '../../utils/constants.js';
import { validateEmail } from '../../utils/validators.js';

/**
 * Admin modal for generating project invitations (`POST /api/projects/:projectId/invites`).
 */
export function InviteMemberModal({ isOpen, onClose, projectId, onCreated }) {
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('developer');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [createdInvite, setCreatedInvite] = useState(null); // { invite, invite_token }
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setEmail('');
    setRole('developer');
    setError('');
    setCreatedInvite(null);
    setCopied(false);
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      const emailErr = validateEmail(trimmedEmail);
      if (emailErr) {
        setError(emailErr);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = { role };
      if (trimmedEmail) payload.email = trimmedEmail;

      const envelope = await memberService.createInvite(projectId, payload);
      setCreatedInvite(envelope.data);
      addToast({
        type: 'success',
        title: 'Invitation created',
        message: trimmedEmail
          ? `Invite link generated for ${trimmedEmail}.`
          : 'Shareable invite link generated.',
      });
      onCreated?.();
    } catch (err) {
      setError(err.message || 'Unable to create invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const inviteUrl = createdInvite?.invite_token
    ? `${window.location.origin}/invites/${createdInvite.invite_token}`
    : '';

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ type: 'info', title: 'Copy link manually from the field below' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      title={createdInvite ? 'Invitation Link Ready' : 'Invite Team Member'}
      subtitle={
        createdInvite
          ? 'Share this one-time link with your teammate. Valid for 7 days.'
          : 'Invite a teammate by email or generate a role-specific invite link.'
      }
      footer={
        createdInvite ? (
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="invite-member-form"
              variant="primary"
              loading={submitting}
              loadingText="Generating..."
              leftIcon={<MailPlus className="w-4 h-4" />}
            >
              Generate Invite
            </Button>
          </>
        )
      }
    >
      {createdInvite ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-accent-success-container/60 border border-accent-success/25 p-3.5 text-body-sm text-on-surface">
            Assigned role:{' '}
            <strong className="capitalize">{createdInvite.invite?.role || role}</strong>
            {createdInvite.invite?.email ? (
              <span> · Restricted to {createdInvite.invite.email}</span>
            ) : null}
          </div>

          <Input
            label="Shareable invite URL"
            value={inviteUrl}
            readOnly
            rightElement={
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-accent-success" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            }
          />
        </div>
      ) : (
        <form id="invite-member-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <ErrorBanner message={error} onDismiss={() => setError('')} />

          <Input
            label="Teammate email (optional)"
            type="email"
            placeholder="teammate@traceboard.io"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            hint="Leave blank to create an open role invite link."
          />

          <Select
            label="Project role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={PROJECT_ROLES.map((r) => ({
              value: r,
              label: r.charAt(0).toUpperCase() + r.slice(1),
            }))}
          />
        </form>
      )}
    </Modal>
  );
}
