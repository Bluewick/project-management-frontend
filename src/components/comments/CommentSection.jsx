import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Pencil, Reply, Send, Trash2 } from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';
import { Button } from '../common/Button.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { CardSkeleton } from '../feedback/Skeleton.jsx';
import { ErrorBanner } from '../feedback/ErrorBanner.jsx';
import { MentionInput } from './MentionInput.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useProject } from '../../hooks/useProject.js';
import { useToast } from '../../hooks/useToast.js';
import { commentService } from '../../services/comment.service.js';
import { formatRelativeTime, parseCommentMentions } from '../../utils/formatters.js';

function RenderedCommentBody({ body }) {
  const segments = parseCommentMentions(body);
  return (
    <p className="text-body-sm text-on-surface whitespace-pre-wrap break-words leading-relaxed">
      {segments.map((seg, idx) =>
        seg.type === 'mention' ? (
          <span
            key={idx}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-primary-container text-on-primary-container font-medium text-caption-xs"
          >
            {seg.value}
          </span>
        ) : (
          <span key={idx}>{seg.value}</span>
        )
      )}
    </p>
  );
}

function CommentItem({
  comment,
  projectId,
  issueId,
  members,
  currentUserId,
  isProjectAdmin,
  canComment,
  isReply = false,
  onUpdated,
  onDeleted,
  onReplyCreated,
}) {
  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [savingEdit, setSavingEdit] = useState(false);

  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = comment.author_id === currentUserId;
  const canEdit = canComment && isAuthor;
  const canDelete = canComment && (isAuthor || isProjectAdmin);

  const loadReplies = useCallback(async () => {
    setLoadingReplies(true);
    try {
      const envelope = await commentService.listComments(projectId, issueId, {
        parent_comment_id: comment.id,
        limit: 100,
      });
      setReplies(Array.isArray(envelope?.data) ? envelope.data : []);
      setShowReplies(true);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to load replies',
        message: error.message,
      });
    } finally {
      setLoadingReplies(false);
    }
  }, [projectId, issueId, comment.id, addToast]);

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!editBody.trim()) return;
    setSavingEdit(true);
    try {
      const envelope = await commentService.updateComment(projectId, issueId, comment.id, {
        body: editBody.trim(),
      });
      onUpdated?.(envelope.data);
      setIsEditing(false);
    } catch (error) {
      addToast({ type: 'error', title: 'Update failed', message: error.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await commentService.deleteComment(projectId, issueId, comment.id);
      setConfirmDeleteOpen(false);
      onDeleted?.(comment.id);
      addToast({ type: 'success', title: 'Comment deleted' });
    } catch (error) {
      addToast({ type: 'error', title: 'Delete failed', message: error.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleReplySubmit = async (event) => {
    event.preventDefault();
    if (!replyBody.trim()) return;
    setSubmittingReply(true);
    try {
      const envelope = await commentService.createComment(projectId, issueId, {
        body: replyBody.trim(),
        parent_comment_id: comment.id,
      });
      setReplyBody('');
      setShowReplyBox(false);
      setReplies((prev) => [...prev, envelope.data]);
      setShowReplies(true);
      onReplyCreated?.(comment.id);
    } catch (error) {
      addToast({ type: 'error', title: 'Reply failed', message: error.message });
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className={isReply ? 'pl-4 border-l-2 border-outline space-y-2' : 'space-y-2.5'}>
      <div className="rounded-xl border border-outline bg-surface-bright p-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={comment.author?.avatar_url}
              name={comment.author?.full_name}
              email={comment.author?.email}
              size="sm"
            />
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <span className="text-body-sm font-semibold text-on-surface truncate">
                {comment.author?.full_name || 'Member'}
              </span>
              <span className="text-caption-xs text-on-surface-muted">
                {formatRelativeTime(comment.created_at)}
              </span>
              {comment.is_edited ? (
                <span className="text-caption-xs text-on-surface-muted">(edited)</span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isReply && canComment ? (
              <button
                type="button"
                onClick={() => setShowReplyBox((prev) => !prev)}
                className="p-1.5 rounded-md text-on-surface-muted hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                title="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            ) : null}
            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setEditBody(comment.body);
                  setIsEditing((prev) => !prev);
                }}
                className="p-1.5 rounded-md text-on-surface-muted hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                title="Edit comment"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="p-1.5 rounded-md text-on-surface-muted hover:text-accent-error hover:bg-accent-error-container transition-colors cursor-pointer"
                title="Delete comment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-2 pt-1">
            <MentionInput
              value={editBody}
              onChange={setEditBody}
              members={members}
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={savingEdit}>
                Save
              </Button>
            </div>
          </form>
        ) : (
          <RenderedCommentBody body={comment.body} />
        )}

        {!isReply && (comment.reply_count > 0 || replies.length > 0) ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                if (showReplies) {
                  setShowReplies(false);
                } else {
                  loadReplies();
                }
              }}
              className="text-caption-xs font-medium text-primary hover:text-primary-hover cursor-pointer"
            >
              {loadingReplies
                ? 'Loading replies...'
                : showReplies
                  ? 'Hide replies'
                  : `View ${Math.max(comment.reply_count || 0, replies.length)} ${
                      Math.max(comment.reply_count || 0, replies.length) === 1
                        ? 'reply'
                        : 'replies'
                    }`}
            </button>
          </div>
        ) : null}
      </div>

      {/* Inline Reply Box */}
      {showReplyBox ? (
        <form onSubmit={handleReplySubmit} className="pl-4 border-l-2 border-primary/40 space-y-2">
          <MentionInput
            value={replyBody}
            onChange={setReplyBody}
            members={members}
            placeholder="Write a reply..."
            rows={2}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowReplyBox(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submittingReply}
              disabled={!replyBody.trim()}
            >
              Reply
            </Button>
          </div>
        </form>
      ) : null}

      {/* Nested Replies */}
      {showReplies && replies.length > 0 ? (
        <div className="space-y-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              projectId={projectId}
              issueId={issueId}
              members={members}
              currentUserId={currentUserId}
              isProjectAdmin={isProjectAdmin}
              canComment={canComment}
              isReply
              onUpdated={(updated) =>
                setReplies((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
              }
              onDeleted={(deletedId) =>
                setReplies((prev) => prev.filter((r) => r.id !== deletedId))
              }
            />
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete comment"
        description="This comment and any nested replies will be permanently removed."
        confirmLabel="Delete"
      />
    </div>
  );
}

/**
 * Threaded issue comments section with `@mention` support.
 */
export function CommentSection({ projectId, issueId, refreshSignal = 0, onMutated }) {
  const { user } = useAuth();
  const { members, isProjectAdmin, canComment } = useProject();
  const { addToast } = useToast();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newBody, setNewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!projectId || !issueId) return;

    let active = true;
    commentService
      .listComments(projectId, issueId, { top_level_only: true, limit: 100 })
      .then((envelope) => {
        if (!active) return;
        setComments(Array.isArray(envelope?.data) ? envelope.data : []);
        setLoading(false);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setLoading(false);
        setError(err.message || 'Unable to load comments.');
      });

    return () => {
      active = false;
    };
  }, [projectId, issueId, refreshSignal]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!newBody.trim()) return;
    setSubmitting(true);
    try {
      const envelope = await commentService.createComment(projectId, issueId, {
        body: newBody.trim(),
      });
      setComments((prev) => [...prev, envelope.data]);
      setNewBody('');
      onMutated?.();
    } catch (err) {
      addToast({ type: 'error', title: 'Comment failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {canComment ? (
        <form onSubmit={handleSubmit} className="surface-card rounded-xl p-3.5 space-y-2.5">
          <MentionInput
            value={newBody}
            onChange={setNewBody}
            members={members}
            rows={3}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption-xs text-on-surface-muted">
              Type <code className="px-1 py-0.5 rounded bg-surface-container">@</code> to
              mention a project member.
            </span>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!newBody.trim()}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Comment
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <CardSkeleton lines={3} />
      ) : comments.length === 0 ? (
        <div className="surface-card rounded-xl p-8 text-center">
          <MessageSquare className="w-5 h-5 text-on-surface-muted mx-auto mb-1.5" />
          <p className="text-body-sm text-on-surface-variant">
            No comments yet. Start the discussion above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              projectId={projectId}
              issueId={issueId}
              members={members}
              currentUserId={user?.id}
              isProjectAdmin={isProjectAdmin}
              canComment={canComment}
              onUpdated={(updated) =>
                setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
              }
              onDeleted={(deletedId) =>
                setComments((prev) => prev.filter((c) => c.id !== deletedId))
              }
              onReplyCreated={(parentId) => {
                setComments((prev) =>
                  prev.map((c) =>
                    c.id === parentId
                      ? { ...c, reply_count: (Number(c.reply_count) || 0) + 1 }
                      : c
                  )
                );
                onMutated?.();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
