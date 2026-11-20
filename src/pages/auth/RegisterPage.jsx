import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { PasswordStrengthMeter } from '../../components/common/PasswordStrengthMeter.jsx';
import { ErrorBanner } from '../../components/feedback/ErrorBanner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import {
  evaluatePasswordStrength,
  sanitizeFullNameInput,
  validateEmail,
  validateFullName,
  validatePassword,
} from '../../utils/validators.js';
import { PENDING_INVITE_STORAGE_KEY } from './LoginPage.jsx';

/**
 * New user registration page (`POST /api/auth/register`) with name sanitization,
 * password strength indicator, and live validation warnings.
 */
export function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [fullName, setFullName] = useState('');
  const [nameBlockedWarning, setNameBlockedWarning] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCapsCheck = (event) => {
    if (typeof event.getModifierState === 'function') {
      setCapsLockOn(event.getModifierState('CapsLock'));
    }
  };

  const handleNameChange = (rawValue) => {
    const { sanitized, hadDisallowed } = sanitizeFullNameInput(rawValue);
    setFullName(sanitized);

    if (hadDisallowed) {
      setNameBlockedWarning(
        'Numbers and special characters (such as 0, %, #, $) are not allowed in your name.'
      );
    } else if (nameBlockedWarning) {
      setNameBlockedWarning('');
    }

    if (fieldErrors.fullName) {
      setFieldErrors((prev) => ({ ...prev, fullName: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError('');
    setNameBlockedWarning('');

    const nextErrors = {};
    const nameErr = validateFullName(fullName);
    if (nameErr) nextErrors.fullName = nameErr;

    const emailErr = validateEmail(email);
    if (emailErr) nextErrors.email = emailErr;

    const passwordErr = validatePassword(password);
    if (passwordErr) nextErrors.password = passwordErr;

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });

      addToast({
        type: 'success',
        title: 'Account created',
        message: 'Your Traceboard workspace is ready.',
      });

      let pendingToken = null;
      try {
        pendingToken = window.sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY);
      } catch {
        pendingToken = null;
      }

      const redirectTarget =
        location.state?.from?.pathname ||
        (pendingToken ? `/invites/${pendingToken}` : '/projects');
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      setApiError(error.message || 'Unable to register account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const strength = evaluatePasswordStrength(password);
  const showWeakPasswordWarning =
    password.length >= 8 && strength.level === 'weak' && !fieldErrors.password;
  const confirmMismatch =
    Boolean(confirmPassword) && confirmPassword !== password && !fieldErrors.confirmPassword;
  const confirmMatched = Boolean(confirmPassword) && confirmPassword === password;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join your engineering team on Traceboard."
      footer={
        <span>
          Already have an account?{' '}
          <Link
            to="/login"
            state={location.state}
            className="text-primary hover:text-primary-hover font-medium"
          >
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorBanner message={apiError} onDismiss={() => setApiError('')} />

        <div className="space-y-1.5">
          <Input
            label="Full name"
            type="text"
            name="full_name"
            autoComplete="name"
            placeholder="Alex Rivera"
            maxLength={120}
            value={fullName}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => {
              if (fullName.trim()) {
                const err = validateFullName(fullName);
                if (err) setFieldErrors((prev) => ({ ...prev, fullName: err }));
              }
            }}
            error={fieldErrors.fullName}
            hint={!nameBlockedWarning ? 'Letters, spaces, hyphens, and apostrophes only.' : ''}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          {nameBlockedWarning && !fieldErrors.fullName ? (
            <p
              role="status"
              className="inline-flex items-start gap-1.5 text-caption-xs text-on-accent-warning animate-fade-in"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{nameBlockedWarning}</span>
            </p>
          ) : null}
        </div>

        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="name@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
          }}
          onBlur={() => {
            if (email.trim()) {
              const err = validateEmail(email);
              if (err) setFieldErrors((prev) => ({ ...prev, email: err }));
            }
          }}
          error={fieldErrors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <div className="space-y-2">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
            }}
            onKeyDown={handleCapsCheck}
            onKeyUp={handleCapsCheck}
            onBlur={() => {
              if (password) {
                const err = validatePassword(password);
                if (err) setFieldErrors((prev) => ({ ...prev, password: err }));
              }
            }}
            error={fieldErrors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-on-surface-muted hover:text-on-surface p-1 rounded transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />

          {capsLockOn ? (
            <p
              role="status"
              className="inline-flex items-center gap-1.5 text-caption-xs text-on-accent-warning"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Caps Lock is on</span>
            </p>
          ) : null}

          <PasswordStrengthMeter password={password} />

          {showWeakPasswordWarning ? (
            <p
              role="status"
              className="inline-flex items-start gap-1.5 text-caption-xs text-on-accent-warning"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Your password is weak. Consider adding uppercase letters, numbers, or symbols.
              </span>
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            name="confirm_password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }
            }}
            onKeyDown={handleCapsCheck}
            onKeyUp={handleCapsCheck}
            error={fieldErrors.confirmPassword || (confirmMismatch ? 'Passwords do not match.' : '')}
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-on-surface-muted hover:text-on-surface p-1 rounded transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />

          {confirmMatched ? (
            <p className="inline-flex items-center gap-1.5 text-caption-xs text-on-accent-success">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Passwords match</span>
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          loadingText="Creating account..."
          className="mt-2"
        >
          Create Account
        </Button>
      </form>
    </AuthLayout>
  );
}
