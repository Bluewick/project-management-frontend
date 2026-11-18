import { useEffect, useRef } from 'react';
import { connectSocket } from '../services/socket.js';

/**
 * Subscribe to a Socket.IO project room (`project:<projectId>`) and event callbacks.
 * @param {string | null | undefined} projectId
 * @param {Record<string, (payload: any) => void>} handlers
 */
export function useProjectSocket(projectId, handlers = {}) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!projectId) return;

    const socket = connectSocket();
    if (!socket) return;

    const joinRoom = () => {
      socket.emit('project:join', { project_id: projectId });
    };

    if (socket.connected) {
      joinRoom();
    }
    socket.on('connect', joinRoom);

    const eventNames = ['issue:created', 'issue:updated', 'issue:moved', 'issue:deleted'];
    const listeners = eventNames.map((eventName) => {
      const fn = (payload) => {
        handlersRef.current[eventName]?.(payload);
      };
      socket.on(eventName, fn);
      return { eventName, fn };
    });

    return () => {
      socket.off('connect', joinRoom);
      listeners.forEach(({ eventName, fn }) => socket.off(eventName, fn));
      socket.emit('project:leave', { project_id: projectId });
    };
  }, [projectId]);
}

/**
 * Subscribe to a Socket.IO issue room (`issue:<issueId>`) and event callbacks.
 * @param {string | null | undefined} projectId
 * @param {string | null | undefined} issueId
 * @param {Record<string, (payload: any) => void>} handlers
 */
export function useIssueSocket(projectId, issueId, handlers = {}) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!projectId || !issueId) return;

    const socket = connectSocket();
    if (!socket) return;

    const joinRoom = () => {
      socket.emit('issue:join', { project_id: projectId, issue_id: issueId });
    };

    if (socket.connected) {
      joinRoom();
    }
    socket.on('connect', joinRoom);

    const eventNames = [
      'issue:updated',
      'issue:moved',
      'issue:deleted',
      'comment:added',
      'comment:updated',
      'comment:deleted',
      'attachment:added',
      'attachment:deleted',
    ];

    const listeners = eventNames.map((eventName) => {
      const fn = (payload) => {
        handlersRef.current[eventName]?.(payload);
      };
      socket.on(eventName, fn);
      return { eventName, fn };
    });

    return () => {
      socket.off('connect', joinRoom);
      listeners.forEach(({ eventName, fn }) => socket.off(eventName, fn));
      socket.emit('issue:leave', { issue_id: issueId });
    };
  }, [projectId, issueId]);
}
