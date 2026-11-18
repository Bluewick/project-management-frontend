import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Save, UserCheck } from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { PasswordStrengthMeter } from '../../components/common/PasswordStrengthMeter.jsx';
import { ErrorBanner } from '../../components/feedback/ErrorBanner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { userService } from '../../services/user.service.js';
import {
  sanitizeFullNameInput,
  validateFullName,
  validateHttpUrl,
  validatePassword,
} from '../../utils/validators.js';
import { formatDate } from '../../utils/formatters.js';

/**
 * Authenticated user profile & password management (`/settings/profile`).
 */
export function ProfileSettingsPage() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();

  // Profile form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [profileErrors, setProfileErrors] = useState({});
  const [profileApiError, setProfileApiError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordApiError, setPasswordApiError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileApiError('');

    const nextErrors = {};
    const nameErr = validateFullName(fullName);
    if (nameErr) {
      nextErrors.fullName = nameErr;
    }

    const avatarErr = validateHttpUrl(avatarUrl);
    if (avatarErr) {
      nextErrors.avatarUrl = avatarErr;
    }

    setProfileErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const trimmedName = fullName.trim();
    setSavingProfile(true);
    try {
      const envelope = await userService.updateMe({
        full_name: trimmedName,
        avatar_url: avatarUrl.trim(),
      });
      setUser(envelope.data);
      addToast({
        type: 'success',
        title: 'Profile updated',
        message: 'Your personal details have been saved.',
      });
    } catch (error) {
      setProfileApiError(error.message || 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordApiError('');

    const nextErrors = {};
    if (!currentPassword) {
      nextErrors.currentPassword = 'Current password is required.';
    }

    const newPwdErr = validatePassword(newPassword);
    if (newPwdErr) {
      nextErrors.newPassword = newPwdErr;
    }

    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'New passwords do not match.';
    }

    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSavingPassword(true);
    try {
      const envelope = await userService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast({
        type: 'success',
        title: 'Password updated',
        message:
          envelope?.message ||
          'Password updated successfully. Other devices will need to sign in again.',
      });
    } catch (error) {
      setPasswordApiError(error.message || 'Unable to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Profile Settings</h1>
        <p className="text-body-sm text-on-surface-variant mt-0.5">
          Manage your identity, avatar, and account security.
        </p>
      </div>

      {/* Profile Details Card */}
      <Card padding="lg" className="space-y-5">
        <CardHeader
          title="Personal Information"
          subtitle="Visible to teammates on issues, comments, and project rosters."
          action={<Badge variant="success">Active</Badge>}
        />

        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-outline">
          <Avatar
            src={avatarUrl.trim() || user?.avatar_url}
            name={fullName.trim() || user?.full_name}
            email={user?.email}
            size="xl"
          />
          <div className="min-w-0">
            <p className="text-headline-sm text-on-surface truncate">
              {fullName.trim() || user?.full_name}
            </p>
            <p className="text-body-sm text-on-surface-variant truncate">{user?.email}</p>
            <p className="text-caption-xs text-on-surface-muted mt-1">
              Member since {formatDate(user?.created_at)}
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4" noValidate>
          <ErrorBanner message={profileApiError} onDismiss={() => setProfileApiError('')} />

          <Input
            label="Email address"
            type="email"
            value={user?.email || ''}
            disabled
            hint="Account email cannot be changed."
          />

          <Input
            label="Full name"
            type="text"
            value={fullName}
            onChange={(e) => {
              const { sanitized } = sanitizeFullNameInput(e.target.value);
              setFullName(sanitized);
              if (profileErrors.fullName) {
                setProfileErrors((prev) => ({ ...prev, fullName: '' }));
              }
            }}
            error={profileErrors.fullName}
            hint="Letters, spaces, hyphens, and apostrophes only."
            required
          />

          <Input
            label="Avatar URL"
            type="url"
            placeholder="https://avatars.githubusercontent.com/u/1?v=4"
            value={avatarUrl}
            onChange={(e) => {
              setAvatarUrl(e.target.value);
              if (profileErrors.avatarUrl) {
                setProfileErrors((prev) => ({ ...prev, avatarUrl: '' }));
              }
            }}
            error={profileErrors.avatarUrl}
            hint="Leave blank to use your initials avatar."
          />

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              loading={savingProfile}
              loadingText="Saving..."
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Password Security Card */}
      <Card padding="lg" className="space-y-5">
        <CardHeader
          title="Change Password"
          subtitle="Updating your password signs out active sessions on other devices."
          action={
            <button
              type="button"
              onClick={() => setShowPasswords((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showPasswords ? 'Hide' : 'Show'}</span>
            </button>
          }
        />

        <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
          <ErrorBanner message={passwordApiError} onDismiss={() => setPasswordApiError('')} />

          <Input
            label="Current password"
            type={showPasswords ? 'text' : 'password'}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (passwordErrors.currentPassword) {
                setPasswordErrors((prev) => ({ ...prev, currentPassword: '' }));
              }
            }}
            error={passwordErrors.currentPassword}
            leftIcon={<KeyRound className="w-4 h-4" />}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New password"
              type={showPasswords ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (passwordErrors.newPassword) {
                  setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                }
              }}
              error={passwordErrors.newPassword}
              required
            />

            <Input
              label="Confirm new password"
              type={showPasswords ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordErrors.confirmPassword) {
                  setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }
              }}
              error={passwordErrors.confirmPassword}
              required
            />
          </div>

          <PasswordStrengthMeter password={newPassword} />

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="secondary"
              loading={savingPassword}
              loadingText="Updating..."
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
