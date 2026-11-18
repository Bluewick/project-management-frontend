import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { ErrorBanner } from '../../components/feedback/ErrorBanner.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { validateEmail } from '../../utils/validators.js';

export const PENDING_INVITE_STORAGE_KEY = 'traceboard_pending_invite_token';

/**
 * User sign-in page (`POST /api/auth/login`) with inline validation & Caps Lock warning.
 */
export function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError('');

    const nextErrors = {};
    const emailErr = validateEmail(email);
    if (emailErr) nextErrors.email = emailErr;
    if (!password) nextErrors.password = 'Password is required.';

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const envelope = await login({ email: email.trim(), password });
      addToast({
        type: 'success',
        title: 'Welcome back',
        message: `Signed in as ${envelope?.data?.user?.full_name || email.trim()}.`,
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
      if (error.code === 'AUTH_RATE_LIMIT_EXCEEDED') {
        setApiError('Too many login attempts. Please wait a few minutes before trying again.');
      } else {
        setApiError(error.message || 'Unable to sign in. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to Traceboard"
      subtitle="Enter your workspace credentials to continue."
      footer={
        <span>
          New to Traceboard?{' '}
          <Link
            to="/register"
            state={location.state}
            className="text-primary hover:text-primary-hover font-medium"
          >
            Create an account
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorBanner message={apiError} onDismiss={() => setApiError('')} />

        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="alex.dev@traceboard.io"
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

        <div className="space-y-1.5">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
            }}
            onKeyDown={handleCapsCheck}
            onKeyUp={handleCapsCheck}
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
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          loadingText="Signing in..."
          className="mt-2"
        >
          Sign In
        </Button>
      </form>
    </AuthLayout>
  );
}
