import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MailCheck, ShieldAlert } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Spinner } from '../../components/feedback/Spinner.jsx';
import { ErrorBanner } from '../../components/feedback/ErrorBanner.jsx';
import { SessionBootstrapLoader } from '../../components/feedback/SessionBootstrapLoader.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { memberService } from '../../services/member.service.js';
import { PENDING_INVITE_STORAGE_KEY } from './LoginPage.jsx';

/**
 * Project invitation acceptance flow (`/invites/:token`).
 */
export function AcceptInvitePage() {
  const { token } = useParams();
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState('idle'); // 'idle' | 'accepting' | 'accepted' | 'error'
  const [acceptedResult, setAcceptedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const attemptedTokenRef = useRef('');

  const handleAccept = useCallback(async () => {
    if (!token) return;
    setStatus('accepting');
    setErrorMessage('');

    try {
      const envelope = await memberService.acceptInvite(token);
      try {
        window.sessionStorage.removeItem(PENDING_INVITE_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
      setAcceptedResult(envelope.data);
      setStatus('accepted');
      addToast({
        type: 'success',
        title: 'Invitation accepted',
        message: `Joined ${envelope.data?.project?.name || 'project'}.`,
      });
    } catch (error) {
      setErrorMessage(error.message || 'Unable to accept this invitation.');
      setStatus('error');
    }
  }, [token, addToast]);

  useEffect(() => {
    if (isBootstrapping || !token) return;

    if (!isAuthenticated) {
      try {
        window.sessionStorage.setItem(PENDING_INVITE_STORAGE_KEY, token);
      } catch {
        // Ignore storage errors
      }
      return;
    }

    if (attemptedTokenRef.current !== token) {
      attemptedTokenRef.current = token;
      handleAccept();
    }
  }, [isBootstrapping, isAuthenticated, token, handleAccept]);

  if (isBootstrapping) {
    return <SessionBootstrapLoader />;
  }

  if (!isAuthenticated) {
    return (
      <AuthLayout
        title="You've been invited"
        subtitle="Sign in or create an account to join this Traceboard project."
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-primary-container/60 border border-primary/20 p-4 flex items-start gap-3">
            <MailCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-body-sm text-on-surface-variant">
              Once you authenticate, we will automatically accept your project invitation and
              open the workspace.
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            <Link to="/login" state={{ from: location }}>
              <Button variant="primary" size="lg" fullWidth>
                Sign In to Accept
              </Button>
            </Link>
            <Link to="/register" state={{ from: location }}>
              <Button variant="secondary" size="lg" fullWidth>
                Create New Account
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'accepting' || status === 'idle') {
    return (
      <AuthLayout
        title="Joining project"
        subtitle="Validating your invitation token..."
      >
        <div className="py-8 flex flex-col items-center gap-3">
          <Spinner size="lg" label="Accepting invitation" />
          <p className="text-body-sm text-on-surface-variant">
            Configuring your project membership...
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'accepted' && acceptedResult) {
    const { project, membership } = acceptedResult;
    return (
      <AuthLayout
        title="Welcome to the team"
        subtitle="Your project invitation has been accepted."
      >
        <div className="space-y-5">
          <div className="rounded-xl bg-accent-success-container/70 border border-accent-success/25 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent-success shrink-0 mt-0.5" />
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-headline-sm text-on-surface">{project?.name}</span>
                {project?.key_prefix ? (
                  <Badge variant="primary">{project.key_prefix}</Badge>
                ) : null}
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Assigned role:{' '}
                <strong className="text-on-surface capitalize">
                  {membership?.role || 'member'}
                </strong>
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate(`/projects/${project.id}/board`, { replace: true })}
          >
            Open Project Board
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Invitation unavailable"
      subtitle="We couldn't complete this invitation request."
    >
      <div className="space-y-4">
        <div className="flex justify-center py-2">
          <div className="w-11 h-11 rounded-xl bg-accent-error-container text-accent-error flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <ErrorBanner message={errorMessage} />

        <div className="flex items-center gap-2.5 pt-1">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/projects', { replace: true })}
          >
            Go to Projects
          </Button>
          <Button variant="primary" fullWidth onClick={handleAccept}>
            Retry
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
