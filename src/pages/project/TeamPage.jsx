import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, Trash2, UserPlus, Users } from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { DataTable } from '../../components/common/DataTable.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { ErrorBanner } from '../../components/feedback/ErrorBanner.jsx';
import { InviteMemberModal } from '../../components/projects/InviteMemberModal.jsx';
import { PROJECTS_CHANGED_EVENT } from '../../components/layout/AppShell.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useProject } from '../../hooks/useProject.js';
import { useToast } from '../../hooks/useToast.js';
import { memberService } from '../../services/member.service.js';
import { PROJECT_ROLES } from '../../utils/constants.js';
import { formatDate, formatRelativeTime } from '../../utils/formatters.js';

const ROLE_BADGE_VARIANTS = {
  admin: 'primary',
  manager: 'success',
  developer: 'neutral',
  viewer: 'outline',
};

/**
 * Project Team Roster, RBAC Role Management & Pending Invitations (`/projects/:projectId/team`).
 */
export function TeamPage() {
  const { user } = useAuth();
  const { projectId, project, members, isProjectAdmin, refreshMembers, refreshProject } =
    useProject();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(isProjectAdmin);
  const [inviteError, setInviteError] = useState('');
  const [invitesReloadTick, setInvitesReloadTick] = useState(0);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const [removeTarget, setRemoveTarget] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);

  const [cancelInviteTarget, setCancelInviteTarget] = useState(null);
  const [cancelingInvite, setCancelingInvite] = useState(false);

  useEffect(() => {
    if (!projectId || !isProjectAdmin) {
      return;
    }

    let active = true;
    memberService
      .listInvites(projectId)
      .then((envelope) => {
        if (!active) return;
        setInvites(Array.isArray(envelope?.data) ? envelope.data : []);
        setLoadingInvites(false);
        setInviteError('');
      })
      .catch((err) => {
        if (!active) return;
        setLoadingInvites(false);
        setInviteError(err.message || 'Unable to load pending invitations.');
      });

    return () => {
      active = false;
    };
  }, [projectId, isProjectAdmin, invitesReloadTick]);

  const handleRoleChange = async (member, nextRole) => {
    if (!isProjectAdmin || member.role === nextRole) return;
    setUpdatingUserId(member.user_id);
    try {
      await memberService.updateMemberRole(projectId, member.user_id, nextRole);
      await refreshMembers();
      addToast({
        type: 'success',
        title: 'Role updated',
        message: `${member.full_name} is now ${nextRole}.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Role update failed', message: err.message });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    const isSelf = removeTarget.user_id === user?.id;
    setRemovingMember(true);
    try {
      await memberService.removeMember(projectId, removeTarget.user_id);
      setRemoveTarget(null);

      if (isSelf) {
        window.dispatchEvent(new CustomEvent(PROJECTS_CHANGED_EVENT));
        addToast({ type: 'info', title: 'Left project' });
        navigate('/projects', { replace: true });
        return;
      }

      await Promise.all([refreshMembers(), refreshProject()]);
      window.dispatchEvent(new CustomEvent(PROJECTS_CHANGED_EVENT));
      addToast({
        type: 'success',
        title: 'Member removed',
        message: `${removeTarget.full_name} was removed from the project.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Action failed', message: err.message });
    } finally {
      setRemovingMember(false);
    }
  };

  const handleCancelInvite = async () => {
    if (!cancelInviteTarget) return;
    setCancelingInvite(true);
    try {
      await memberService.cancelInvite(projectId, cancelInviteTarget.id);
      setInvites((prev) => prev.filter((item) => item.id !== cancelInviteTarget.id));
      setCancelInviteTarget(null);
      addToast({ type: 'success', title: 'Invitation canceled' });
    } catch (err) {
      addToast({ type: 'error', title: 'Unable to cancel invite', message: err.message });
    } finally {
      setCancelingInvite(false);
    }
  };

  const memberColumns = [
    {
      key: 'member',
      header: 'Member',
      render: (row) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar src={row.avatar_url} name={row.full_name} email={row.email} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-body-sm font-semibold text-on-surface truncate">
                {row.full_name}
              </span>
              {row.user_id === user?.id ? <Badge variant="primary">You</Badge> : null}
              {row.user_id === project.owner_id ? <Badge variant="success">Owner</Badge> : null}
            </div>
            <p className="text-caption-xs text-on-surface-muted truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) =>
        isProjectAdmin && row.user_id !== project.owner_id ? (
          <select
            aria-label={`Role for ${row.full_name}`}
            value={row.role}
            disabled={updatingUserId === row.user_id}
            onChange={(e) => handleRoleChange(row, e.target.value)}
            className="h-8 rounded-lg border border-outline bg-surface-bright px-2.5 text-caption-xs font-medium text-on-surface cursor-pointer focus-halo disabled:opacity-50"
          >
            {PROJECT_ROLES.map((roleOpt) => (
              <option key={roleOpt} value={roleOpt}>
                {roleOpt.charAt(0).toUpperCase() + roleOpt.slice(1)}
              </option>
            ))}
          </select>
        ) : (
          <Badge variant={ROLE_BADGE_VARIANTS[row.role] || 'neutral'}>
            <span className="capitalize">{row.role}</span>
          </Badge>
        ),
    },
    {
      key: 'joined_at',
      header: 'Joined',
      render: (row) => (
        <span className="text-caption-xs text-on-surface-variant whitespace-nowrap">
          {formatDate(row.joined_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (row) => {
        const isSelf = row.user_id === user?.id;
        const isOwner = row.user_id === project.owner_id;
        if (isOwner) return null;

        if (isSelf) {
          return (
            <Button
              variant="danger-ghost"
              size="sm"
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              onClick={() => setRemoveTarget(row)}
            >
              Leave
            </Button>
          );
        }

        if (isProjectAdmin) {
          return (
            <Button
              variant="danger-ghost"
              size="sm"
              aria-label={`Remove ${row.full_name}`}
              onClick={() => setRemoveTarget(row)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          );
        }

        return null;
      },
    },
  ];

  const inviteColumns = [
    {
      key: 'email',
      header: 'Recipient',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-on-surface-muted shrink-0" />
          <span className="text-body-sm font-medium text-on-surface">
            {row.email || 'Open invite link'}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge variant={ROLE_BADGE_VARIANTS[row.role] || 'neutral'}>
          <span className="capitalize">{row.role}</span>
        </Badge>
      ),
    },
    {
      key: 'invited_by',
      header: 'Invited By',
      render: (row) => (
        <span className="text-caption-xs text-on-surface-variant">
          {row.invited_by_name || 'Admin'}
        </span>
      ),
    },
    {
      key: 'expires_at',
      header: 'Expires',
      render: (row) => (
        <span className="text-caption-xs text-on-surface-muted whitespace-nowrap">
          {formatDate(row.expires_at)} ({formatRelativeTime(row.created_at)})
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (row) => (
        <Button
          variant="danger-ghost"
          size="sm"
          onClick={() => setCancelInviteTarget(row)}
        >
          Cancel
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-headline-lg text-on-surface">Team & Invitations</h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Manage access and project roles for {project.name}.
          </p>
        </div>

        {isProjectAdmin ? (
          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsInviteOpen(true)}
          >
            Invite Member
          </Button>
        ) : null}
      </div>

      {/* Members Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-on-surface-muted" />
          <h2 className="text-headline-sm text-on-surface">
            Project Members ({members.length})
          </h2>
        </div>

        <DataTable columns={memberColumns} data={members} rowKey="user_id" />
      </div>

      {/* Pending Invitations (Admin Only) */}
      {isProjectAdmin ? (
        <Card padding="md" className="space-y-4">
          <CardHeader
            title={`Pending Invitations (${invites.length})`}
            subtitle="Active invitation tokens that have not yet been accepted."
          />

          <ErrorBanner message={inviteError} onDismiss={() => setInviteError('')} />

          <DataTable
            columns={inviteColumns}
            data={invites}
            loading={loadingInvites}
            skeletonRows={2}
            emptyState={
              <p className="text-body-sm text-on-surface-muted text-center">
                No pending invitations.
              </p>
            }
          />
        </Card>
      ) : null}

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        projectId={projectId}
        onCreated={() => setInvitesReloadTick((t) => t + 1)}
      />

      <ConfirmDialog
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveMember}
        loading={removingMember}
        title={removeTarget?.user_id === user?.id ? 'Leave Project' : 'Remove Member'}
        description={
          removeTarget?.user_id === user?.id
            ? `Are you sure you want to leave "${project.name}"? You will need a new invite to rejoin.`
            : `Remove ${removeTarget?.full_name} from "${project.name}"?`
        }
        confirmLabel={removeTarget?.user_id === user?.id ? 'Leave Project' : 'Remove'}
      />

      <ConfirmDialog
        isOpen={Boolean(cancelInviteTarget)}
        onClose={() => setCancelInviteTarget(null)}
        onConfirm={handleCancelInvite}
        loading={cancelingInvite}
        title="Cancel Invitation"
        description={`Revoke the pending invitation${
          cancelInviteTarget?.email ? ` for ${cancelInviteTarget.email}` : ''
        }?`}
        confirmLabel="Revoke Invite"
      />
    </div>
  );
}
