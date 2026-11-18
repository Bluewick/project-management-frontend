import { useEffect, useRef, useState } from 'react';
import {
  Download,
  Eye,
  FileCode2,
  FileText,
  Film,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { Modal } from '../common/Modal.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { ErrorBanner } from '../feedback/ErrorBanner.jsx';
import { CardSkeleton } from '../feedback/Skeleton.jsx';
import { useProject } from '../../hooks/useProject.js';
import { useToast } from '../../hooks/useToast.js';
import { attachmentService } from '../../services/attachment.service.js';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_DIRECT_ATTACHMENT_BYTES,
  MAX_PRESIGN_ATTACHMENT_BYTES,
} from '../../utils/constants.js';
import { formatBytes, formatRelativeTime } from '../../utils/formatters.js';

function getFileIcon(mimeType) {
  if (!mimeType) return FileText;
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType === 'application/json') return FileCode2;
  return FileText;
}

/**
 * Issue attachments uploader & gallery supporting S3 presigned upload + direct fallback.
 */
export function AttachmentPanel({ projectId, issueId, refreshSignal = 0, onMutated }) {
  const { canWriteIssues } = useProject();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const [uploadState, setUploadState] = useState({
    active: false,
    fileName: '',
    progress: 0,
  });

  const [previewItem, setPreviewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!projectId || !issueId) return;

    let active = true;
    attachmentService
      .listAttachments(projectId, issueId)
      .then((envelope) => {
        if (!active) return;
        setAttachments(Array.isArray(envelope?.data) ? envelope.data : []);
        setLoading(false);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setLoading(false);
        setError(err.message || 'Unable to load attachments.');
      });

    return () => {
      active = false;
    };
  }, [projectId, issueId, refreshSignal]);

  const handleUploadFile = async (file) => {
    if (!file || !canWriteIssues) return;
    setError('');

    if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.type)) {
      setError(
        `Unsupported file type (${file.type || 'unknown'}). Allowed: PNG, JPEG, WebP, GIF, MP4, WebM, TXT, JSON, PDF.`
      );
      return;
    }

    if (file.size <= 0 || file.size > MAX_PRESIGN_ATTACHMENT_BYTES) {
      setError(`File size must be between 1 byte and ${formatBytes(MAX_PRESIGN_ATTACHMENT_BYTES)}.`);
      return;
    }

    setUploadState({ active: true, fileName: file.name, progress: 5 });

    try {
      let uploadedRecord = null;

      try {
        const presignRes = await attachmentService.presignUpload(projectId, issueId, {
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        });

        const { attachment, upload_url: uploadUrl } = presignRes.data;
        await attachmentService.uploadToPresignedUrl(uploadUrl, file, (pct) => {
          setUploadState((prev) => ({ ...prev, progress: Math.max(10, Math.min(95, pct)) }));
        });

        const confirmRes = await attachmentService.confirmUpload(
          projectId,
          issueId,
          attachment.id
        );
        uploadedRecord = confirmRes.data;
      } catch (presignErr) {
        if (file.size <= MAX_DIRECT_ATTACHMENT_BYTES) {
          const directRes = await attachmentService.directUpload(
            projectId,
            issueId,
            file,
            (pct) => {
              setUploadState((prev) => ({ ...prev, progress: pct }));
            }
          );
          uploadedRecord = directRes.data;
        } else {
          throw presignErr;
        }
      }

      if (uploadedRecord) {
        setAttachments((prev) => {
          const exists = prev.some((item) => item.id === uploadedRecord.id);
          return exists ? prev : [...prev, uploadedRecord];
        });
        addToast({
          type: 'success',
          title: 'Attachment uploaded',
          message: file.name,
        });
        onMutated?.();
      }
    } catch (err) {
      setError(err.message || 'File upload failed.');
    } finally {
      setUploadState({ active: false, fileName: '', progress: 0 });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await attachmentService.deleteAttachment(projectId, issueId, deleteTarget.id);
      setAttachments((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      addToast({
        type: 'success',
        title: 'Attachment deleted',
        message: deleteTarget.file_name,
      });
      setDeleteTarget(null);
      onMutated?.();
    } catch (err) {
      addToast({ type: 'error', title: 'Delete failed', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="surface-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-on-surface-muted" />
          <h2 className="text-headline-sm text-on-surface">
            Attachments ({attachments.length})
          </h2>
        </div>

        {canWriteIssues ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_ATTACHMENT_MIME_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadFile(file);
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={uploadState.active}
              leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload File
            </Button>
          </>
        ) : null}
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {canWriteIssues ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const droppedFile = e.dataTransfer.files?.[0];
            if (droppedFile) handleUploadFile(droppedFile);
          }}
          className={[
            'rounded-lg border border-dashed px-4 py-3 text-center transition-colors',
            isDragOver
              ? 'border-primary bg-primary-container/50'
              : 'border-outline bg-surface-container-low',
          ].join(' ')}
        >
          {uploadState.active ? (
            <div className="space-y-1.5 max-w-xs mx-auto">
              <p className="text-caption-xs font-medium text-on-surface truncate">
                Uploading {uploadState.fileName} ({uploadState.progress}%)
              </p>
              <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-150"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-caption-xs text-on-surface-variant">
              Drag & drop a file here, or click <strong>Upload File</strong> (images, videos, PDF,
              TXT, JSON up to 25 MB).
            </p>
          )}
        </div>
      ) : null}

      {loading ? (
        <CardSkeleton lines={2} />
      ) : attachments.length === 0 ? (
        <p className="text-body-sm text-on-surface-muted py-2">No files attached yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {attachments.map((item) => {
            const isImage = item.mime_type?.startsWith('image/');
            const Icon = getFileIcon(item.mime_type);

            return (
              <div
                key={item.id}
                className="rounded-lg border border-outline bg-surface-bright p-2.5 flex items-center gap-3 min-w-0"
              >
                {isImage && item.download_url ? (
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    className="w-11 h-11 rounded-md overflow-hidden border border-outline shrink-0 cursor-pointer"
                  >
                    <img
                      src={item.download_url}
                      alt={item.file_name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="w-11 h-11 rounded-md bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-on-surface truncate">
                    {item.file_name}
                  </p>
                  <p className="text-caption-xs text-on-surface-muted truncate">
                    {formatBytes(item.file_size)} · {formatRelativeTime(item.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isImage && item.download_url ? (
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      aria-label={`Preview ${item.file_name}`}
                      className="p-1.5 rounded-md text-on-surface-muted hover:text-on-surface hover:bg-surface-container cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  {item.download_url ? (
                    <a
                      href={item.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Download ${item.file_name}`}
                      className="p-1.5 rounded-md text-on-surface-muted hover:text-primary hover:bg-primary-container transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  ) : null}

                  {canWriteIssues ? (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`Delete ${item.file_name}`}
                      className="p-1.5 rounded-md text-on-surface-muted hover:text-accent-error hover:bg-accent-error-container cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      <Modal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        size="xl"
        title={previewItem?.file_name}
      >
        {previewItem?.download_url ? (
          <div className="flex justify-center bg-surface-container-low rounded-lg p-2">
            <img
              src={previewItem.download_url}
              alt={previewItem.file_name}
              className="max-h-[70vh] object-contain rounded"
            />
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete attachment"
        description={`Remove "${deleteTarget?.file_name}" permanently from this issue?`}
        confirmLabel="Delete"
      />
    </div>
  );
}
