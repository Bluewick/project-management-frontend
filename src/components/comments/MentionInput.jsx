import { useMemo, useRef, useState } from 'react';
import { Avatar } from '../common/Avatar.jsx';
import { formatMentionToken } from '../../utils/formatters.js';

/**
 * Comment textarea with `@mention` teammate autocomplete generating `@[Name](uuid)` tokens.
 */
export function MentionInput({
  value,
  onChange,
  members = [],
  placeholder = 'Write a comment... Type @ to mention a teammate',
  rows = 3,
  disabled = false,
  autoFocus = false,
}) {
  const textareaRef = useRef(null);
  const [mentionQuery, setMentionQuery] = useState(null); // { start, query }
  const [selectedIndex, setSelectedIndex] = useState(0);

  const suggestions = useMemo(() => {
    if (!mentionQuery) return [];
    const q = mentionQuery.query.toLowerCase();
    return members
      .filter(
        (m) =>
          (m.full_name || '').toLowerCase().includes(q) ||
          (m.email || '').toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [mentionQuery, members]);

  const detectMention = (text, cursorPos) => {
    const prefix = text.slice(0, cursorPos);
    const match = prefix.match(/(?:^|\s)@([A-Za-z0-9._-]{0,30})$/);
    if (!match) {
      setMentionQuery(null);
      return;
    }
    const atIndex = prefix.lastIndexOf('@');
    setMentionQuery({ start: atIndex, query: match[1] || '' });
    setSelectedIndex(0);
  };

  const insertMention = (member) => {
    if (!mentionQuery || !textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart ?? value.length;
    const token = `${formatMentionToken(member.full_name, member.user_id)} `;
    const nextValue =
      value.slice(0, mentionQuery.start) + token + value.slice(cursorPos);
    onChange(nextValue);
    setMentionQuery(null);

    const nextCursorPos = mentionQuery.start + token.length;
    window.requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursorPos, nextCursorPos);
      }
    });
  };

  const handleKeyDown = (event) => {
    if (!mentionQuery || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const target = suggestions[Math.min(selectedIndex, suggestions.length - 1)];
      if (target) insertMention(target);
    } else if (event.key === 'Escape') {
      setMentionQuery(null);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          detectMention(e.target.value, e.target.selectionStart ?? e.target.value.length);
        }}
        onClick={(e) =>
          detectMention(e.target.value, e.target.selectionStart ?? e.target.value.length)
        }
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg bg-surface-bright border border-outline focus-halo px-3 py-2 text-body-sm text-on-surface placeholder:text-on-surface-muted transition-all resize-y disabled:opacity-55"
      />

      {mentionQuery && suggestions.length > 0 ? (
        <div className="absolute left-0 bottom-full mb-1.5 z-30 surface-popover rounded-xl p-1.5 w-72 max-h-56 overflow-y-auto animate-fade-in">
          <p className="px-2 py-1 text-label-sm text-on-surface-muted">Mention Member</p>
          {suggestions.map((member, idx) => {
            const isActive = idx === Math.min(selectedIndex, suggestions.length - 1);
            return (
              <button
                key={member.user_id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(member);
                }}
                className={[
                  'w-full px-2 py-1.5 rounded-lg flex items-center gap-2.5 text-left transition-colors cursor-pointer',
                  isActive ? 'bg-primary-container text-primary' : 'hover:bg-surface-container',
                ].join(' ')}
              >
                <Avatar
                  src={member.avatar_url}
                  name={member.full_name}
                  email={member.email}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-body-sm font-medium text-on-surface truncate">
                    {member.full_name}
                  </p>
                  <p className="text-caption-xs text-on-surface-muted truncate">
                    {member.email}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
