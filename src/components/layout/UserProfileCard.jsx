import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronsUpDown, LogOut, Settings } from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';
import { Badge } from '../common/Badge.jsx';
import { Popover } from '../common/Popover.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { healthService } from '../../services/health.service.js';

/**
 * Bottom-pinned sidebar user card with Level 2 flyout popover per DESIGN.MD.
 */
export function UserProfileCard({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [apiHealthy, setApiHealthy] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    healthService
      .checkHealth()
      .then((res) => {
        if (active) setApiHealthy(res?.data?.status === 'ok');
      })
      .catch(() => {
        if (active) setApiHealthy(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async (close) => {
    setIsLoggingOut(true);
    try {
      await logout();
      close();
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Popover
      side="top"
      align="left"
      className="w-full"
      panelClassName="w-[232px] p-2"
      trigger={
        <button
          type="button"
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-container transition-colors text-left cursor-pointer"
        >
          <Avatar
            src={user?.avatar_url}
            name={user?.full_name}
            email={user?.email}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-semibold text-on-surface truncate">
              {user?.full_name || 'Workspace Member'}
            </p>
            <p className="text-caption-xs text-on-surface-muted truncate">
              {user?.email || ''}
            </p>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-on-surface-muted shrink-0" />
        </button>
      }
    >
      {({ close }) => (
        <div className="flex flex-col">
          <div className="px-2.5 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-on-surface truncate">
                {user?.full_name}
              </p>
              <p className="text-caption-xs text-on-surface-muted truncate">{user?.email}</p>
            </div>
            <Badge variant="success">PRO</Badge>
          </div>

          <div className="h-px bg-surface-container my-1" />

          <button
            type="button"
            onClick={() => {
              close();
              onNavigate?.();
              navigate('/settings/profile');
            }}
            className="h-9 px-2.5 rounded-lg flex items-center gap-2.5 text-body-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Profile Settings</span>
          </button>

          <div className="h-9 px-2.5 rounded-lg flex items-center justify-between text-body-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-2.5">
              <Activity className="w-4 h-4 shrink-0" />
              <span>API Status</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-caption-xs">
              <span
                className={[
                  'w-2 h-2 rounded-full',
                  apiHealthy === true
                    ? 'bg-accent-success'
                    : apiHealthy === false
                      ? 'bg-accent-error'
                      : 'bg-on-surface-muted',
                ].join(' ')}
              />
              <span>
                {apiHealthy === true ? 'Online' : apiHealthy === false ? 'Offline' : '...'}
              </span>
            </span>
          </div>

          <div className="h-px bg-surface-container my-1" />

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => handleLogout(close)}
            className="h-9 px-2.5 rounded-lg flex items-center gap-2.5 text-body-sm text-on-surface-variant hover:bg-accent-error-container hover:text-accent-error transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
          </button>
        </div>
      )}
    </Popover>
  );
}
