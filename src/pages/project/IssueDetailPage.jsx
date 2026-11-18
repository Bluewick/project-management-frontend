import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bug, CheckSquare, Pencil, Sparkles } from 'lucide-react';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Textarea } from '../../components/common/Textarea.jsx';
import { SegmentedControl } from '../../components/common/SegmentedControl.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { DetailSkeleton } from '../../components/feedback/Skeleton.jsx';
import { ErrorBanner } from '../../components/feedback/ErrorBanner.jsx';
import { IssuePropertiesPanel } from '../../components/issues/IssuePropertiesPanel.jsx';
import { ActivityFeed } from '../../components/issues/ActivityFeed.jsx';
import { CommentSection } from '../../components/comments/CommentSection.jsx';
import { AttachmentPanel } from '../../components/attachments/AttachmentPanel.jsx';
import { useProject } from '../../hooks/useProject.js';
import { useToast } from '../../hooks/useToast.js';
import { useIssueSocket } from '../../hooks/useSocket.js';
import { issueService } from '../../services/issue.service.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TYPE_ICONS = {
  bug: { icon: Bug, className: 'text-accent-error' },
  feature: { icon: Sparkles, className: 'text-primary' },
  task: { icon: CheckSquare, className: 'text-on-surface-variant' },
};

/**
 * Complete Issue Detail workspace (`/projects/:projectId/issues/:issueKey`).
 */
export function IssueDetailPage() {
  const { projectId, issueKey } = useParams();
  const { members, labels, canWriteIssues, refreshProject } = useProject();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');

  const [editingRepro, setEditingRepro] = useState(false);
  const [reproDraft, setReproDraft] = useState('');

  const [savingField, setSavingField] = useState('');
  const [activeTab, setActiveTab] = useState('comments');
  const [activityRefreshTick, setActivityRefreshTick] = useState(0);
  const [commentsRefreshTick, setCommentsRefreshTick] = useState(0);
  const [attachmentsRefreshTick, setAttachmentsRefreshTick] = useState(0);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingIssue, setDeletingIssue] = useState(false);

  useIssueSocket(projectId, issue?.id, {
    'issue:updated': ({ issue: updatedIssue }) => {
      if (!updatedIssue) return;
      setIssue(updatedIssue);
      setActivityRefreshTick((t) => t + 1);
    },
    'issue:moved': ({ issue: movedIssue }) => {
      if (!movedIssue) return;
      setIssue(movedIssue);
      setActivityRefreshTick((t) => t + 1);
    },
    'issue:deleted': () => {
      addToast({ type: 'info', title: 'Issue deleted', message: 'This issue was removed.' });
      navigate(`/projects/${projectId}/board`, { replace: true });
    },
    'comment:added': () => {
      setCommentsRefreshTick((t) => t + 1);
      setActivityRefreshTick((t) => t + 1);
    },
    'comment:updated': () => {
      setCommentsRefreshTick((t) => t + 1);
    },
    'comment:deleted': () => {
      setCommentsRefreshTick((t) => t + 1);
    },
    'attachment:added': () => {
      setAttachmentsRefreshTick((t) => t + 1);
      setActivityRefreshTick((t) => t + 1);
    },
    'attachment:deleted': () => {
      setAttachmentsRefreshTick((t) => t + 1);
      setActivityRefreshTick((t) => t + 1);
    },
  });

  useEffect(() => {
    if (!projectId || !issueKey) return;

    let active = true;
    const request = UUID_REGEX.test(issueKey)
      ? issueService.getIssueById(projectId, issueKey)
      : issueService.getIssueByKey(projectId, issueKey);

    request
      .then((envelope) => {
        if (!active) return;
        setIssue(envelope.data);
        setLoading(false);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setLoading(false);
        setError(err.message || 'Unable to load issue.');
      });

    return () => {
      active = false;
    };
  }, [projectId, issueKey]);

  const handlePatchField = async (patchPayload, fieldName) => {
    if (!issue || !canWriteIssues) return;
    setSavingField(fieldName);
    try {
      const envelope = await issueService.updateIssue(projectId, issue.id, patchPayload);
      setIssue(envelope.data);
      setActivityRefreshTick((t) => t + 1);
      addToast({
        type: 'success',
        title: `${issue.issue_key} updated`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update failed',
        message: err.message || 'Unable to save changes.',
      });
    } finally {
      setSavingField('');
    }
  };

  const handleAttachLabel = async (labelId) => {
    if (!issue || !canWriteIssues) return;
    try {
      const envelope = await issueService.attachLabel(projectId, issue.id, labelId);
      setIssue(envelope.data);
      setActivityRefreshTick((t) => t + 1);
    } catch (err) {
      addToast({ type: 'error', title: 'Unable to attach label', message: err.message });
    }
  };

  const handleDetachLabel = async (labelId) => {
    if (!issue || !canWriteIssues) return;
    try {
      const envelope = await issueService.detachLabel(projectId, issue.id, labelId);
      setIssue(envelope.data);
      setActivityRefreshTick((t) => t + 1);
    } catch (err) {
      addToast({ type: 'error', title: 'Unable to remove label', message: err.message });
    }
  };

  const handleDeleteIssue = async () => {
    if (!issue) return;
    setDeletingIssue(true);
    try {
      await issueService.deleteIssue(projectId, issue.id);
      refreshProject().catch(() => {});
      addToast({
        type: 'success',
        title: `${issue.issue_key} deleted`,
      });
      navigate(`/projects/${projectId}/board`, { replace: true });
    } catch (err) {
      addToast({ type: 'error', title: 'Delete failed', message: err.message });
    } finally {
      setDeletingIssue(false);
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !issue) {
    return (
      <Card padding="lg" className="max-w-lg mx-auto mt-6 space-y-4">
        <ErrorBanner message={error || 'Issue not found.'} />
        <div className="flex items-center gap-2">
          <Link to={`/projects/${projectId}/board`}>
            <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Board
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const typeInfo = TYPE_ICONS[issue.type] || TYPE_ICONS.task;
  const TypeIcon = typeInfo.icon;

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link to={`/projects/${projectId}/board`}>
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Board
            </Button>
          </Link>
          <span className="text-on-surface-muted">/</span>
          <Badge variant="primary">
            <TypeIcon className={`w-3 h-3 ${typeInfo.className}`} />
            <span>{issue.issue_key}</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title & Description Card */}
          <Card padding="lg" className="space-y-5">
            {/* Title */}
            {editingTitle ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (titleDraft.trim().length < 2) return;
                  await handlePatchField({ title: titleDraft.trim() }, 'title');
                  setEditingTitle(false);
                }}
                className="space-y-2.5"
              >
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  autoFocus
                  required
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={savingField === 'title'}
                  >
                    Save Title
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTitle(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-3 group">
                <h1 className="text-headline-lg text-on-surface leading-snug">
                  {issue.title}
                </h1>
                {canWriteIssues ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTitleDraft(issue.title);
                      setEditingTitle(true);
                    }}
                    aria-label="Edit title"
                    className="p-1.5 rounded-lg text-on-surface-muted hover:text-on-surface hover:bg-surface-container transition-colors shrink-0 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            )}

            {/* Description */}
            <div className="space-y-2 pt-2 border-t border-surface-container">
              <div className="flex items-center justify-between">
                <span className="text-label-sm text-on-surface-muted">Description</span>
                {canWriteIssues && !editingDescription ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDescriptionDraft(issue.description || '');
                      setEditingDescription(true);
                    }}
                    className="text-caption-xs font-medium text-primary hover:text-primary-hover cursor-pointer"
                  >
                    Edit
                  </button>
                ) : null}
              </div>

              {editingDescription ? (
                <div className="space-y-2.5">
                  <Textarea
                    rows={5}
                    value={descriptionDraft}
                    onChange={(e) => setDescriptionDraft(e.target.value)}
                    placeholder="Add detailed context or requirements..."
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={savingField === 'description'}
                      onClick={async () => {
                        await handlePatchField(
                          { description: descriptionDraft.trim() },
                          'description'
                        );
                        setEditingDescription(false);
                      }}
                    >
                      Save Description
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingDescription(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : issue.description ? (
                <p className="text-body-md text-on-surface-variant whitespace-pre-wrap break-words leading-relaxed">
                  {issue.description}
                </p>
              ) : (
                <p className="text-body-sm text-on-surface-muted italic">
                  No description provided.
                </p>
              )}
            </div>

            {/* Reproduction Steps (for bugs or when populated) */}
            {issue.type === 'bug' || issue.reproduction_steps ? (
              <div className="space-y-2 pt-3 border-t border-surface-container">
                <div className="flex items-center justify-between">
                  <span className="text-label-sm text-on-surface-muted">
                    Reproduction Steps
                  </span>
                  {canWriteIssues && !editingRepro ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReproDraft(issue.reproduction_steps || '');
                        setEditingRepro(true);
                      }}
                      className="text-caption-xs font-medium text-primary hover:text-primary-hover cursor-pointer"
                    >
                      Edit
                    </button>
                  ) : null}
                </div>

                {editingRepro ? (
                  <div className="space-y-2.5">
                    <Textarea
                      rows={4}
                      value={reproDraft}
                      onChange={(e) => setReproDraft(e.target.value)}
                      placeholder={'1. Step one...\n2. Step two...'}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={savingField === 'reproduction_steps'}
                        onClick={async () => {
                          await handlePatchField(
                            { reproduction_steps: reproDraft.trim() },
                            'reproduction_steps'
                          );
                          setEditingRepro(false);
                        }}
                      >
                        Save Steps
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRepro(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : issue.reproduction_steps ? (
                  <pre className="rounded-lg bg-surface-container-low border border-outline p-3 text-body-sm text-on-surface whitespace-pre-wrap font-sans leading-relaxed">
                    {issue.reproduction_steps}
                  </pre>
                ) : (
                  <p className="text-body-sm text-on-surface-muted italic">
                    No reproduction steps recorded.
                  </p>
                )}
              </div>
            ) : null}
          </Card>

          {/* Attachments */}
          <AttachmentPanel
            projectId={projectId}
            issueId={issue.id}
            refreshSignal={attachmentsRefreshTick}
            onMutated={() => setActivityRefreshTick((t) => t + 1)}
          />

          {/* Comments & Activity Tabs */}
          <div className="space-y-3">
            <SegmentedControl
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: 'comments', label: 'Comments' },
                { value: 'activity', label: 'Activity Log' },
              ]}
            />

            {activeTab === 'comments' ? (
              <CommentSection
                projectId={projectId}
                issueId={issue.id}
                refreshSignal={commentsRefreshTick}
                onMutated={() => setActivityRefreshTick((t) => t + 1)}
              />
            ) : (
              <ActivityFeed
                projectId={projectId}
                issueId={issue.id}
                refreshSignal={activityRefreshTick}
              />
            )}
          </div>
        </div>

        {/* Right Properties Sidebar */}
        <IssuePropertiesPanel
          key={issue.updated_at}
          issue={issue}
          members={members}
          labels={labels}
          canWriteIssues={canWriteIssues}
          savingField={savingField}
          onPatchField={handlePatchField}
          onAttachLabel={handleAttachLabel}
          onDetachLabel={handleDetachLabel}
          onDeleteIssue={() => setConfirmDeleteOpen(true)}
        />
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteIssue}
        loading={deletingIssue}
        title={`Delete ${issue.issue_key}`}
        description="This will permanently delete the issue, its comments, activity history, and attachments."
        confirmLabel="Delete Issue"
      />
    </div>
  );
}
