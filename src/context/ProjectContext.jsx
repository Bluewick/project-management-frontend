import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProjectContext } from './contexts.js';
import { projectService } from '../services/project.service.js';
import { memberService } from '../services/member.service.js';
import { labelService } from '../services/label.service.js';
import { ROLE_PERMISSIONS } from '../utils/constants.js';

const EMPTY_LIST = [];

/**
 * Project workspace provider loading active project metadata, members, labels, and RBAC flags.
 */
export function ProjectProvider({ children }) {
  const { projectId } = useParams();

  const [state, setState] = useState({
    loadedProjectId: null,
    project: null,
    members: [],
    labels: [],
    error: '',
  });
  const [reloadTick, setReloadTick] = useState(0);

  const refreshAll = useCallback(() => {
    setReloadTick((t) => t + 1);
  }, []);

  const refreshProject = useCallback(async () => {
    if (!projectId) return null;
    const envelope = await projectService.getProject(projectId);
    setState((prev) => ({
      ...prev,
      project: envelope.data,
    }));
    return envelope.data;
  }, [projectId]);

  const refreshMembers = useCallback(async () => {
    if (!projectId) return [];
    const envelope = await memberService.listMembers(projectId);
    const list = Array.isArray(envelope?.data) ? envelope.data : [];
    setState((prev) => ({ ...prev, members: list }));
    return list;
  }, [projectId]);

  const refreshLabels = useCallback(async () => {
    if (!projectId) return [];
    const envelope = await labelService.listLabels(projectId);
    const list = Array.isArray(envelope?.data) ? envelope.data : [];
    setState((prev) => ({ ...prev, labels: list }));
    return list;
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    let active = true;
    Promise.all([
      projectService.getProject(projectId),
      memberService.listMembers(projectId),
      labelService.listLabels(projectId),
    ])
      .then(([projRes, membersRes, labelsRes]) => {
        if (!active) return;
        setState({
          loadedProjectId: projectId,
          project: projRes.data,
          members: Array.isArray(membersRes?.data) ? membersRes.data : [],
          labels: Array.isArray(labelsRes?.data) ? labelsRes.data : [],
          error: '',
        });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          loadedProjectId: projectId,
          project: null,
          members: [],
          labels: [],
          error: error.message || 'Unable to load project workspace.',
        });
      });

    return () => {
      active = false;
    };
  }, [projectId, reloadTick]);

  const loading = Boolean(projectId && state.loadedProjectId !== projectId);
  const project = state.loadedProjectId === projectId ? state.project : null;
  const members = state.loadedProjectId === projectId ? state.members : EMPTY_LIST;
  const labels = state.loadedProjectId === projectId ? state.labels : EMPTY_LIST;
  const error = state.loadedProjectId === projectId ? state.error : '';

  const value = useMemo(() => {
    const myRole = project?.my_role || 'viewer';
    const basePerms = ROLE_PERMISSIONS[myRole] || ROLE_PERMISSIONS.viewer;
    const isArchived = Boolean(project?.is_archived);

    return {
      projectId,
      project,
      members,
      labels,
      loading,
      error,
      myRole,
      isArchived,
      permissions: basePerms,
      isProjectAdmin: basePerms.canEditProject,
      canWriteIssues: basePerms.canWriteIssues && !isArchived,
      canDeleteLabels: basePerms.canDeleteLabels && !isArchived,
      canComment: basePerms.canComment && !isArchived,
      refreshAll,
      refreshProject,
      refreshMembers,
      refreshLabels,
    };
  }, [
    projectId,
    project,
    members,
    labels,
    loading,
    error,
    refreshAll,
    refreshProject,
    refreshMembers,
    refreshLabels,
  ]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
