import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaCloud, FaDesktop } from 'react-icons/fa';
import { api } from '../services/api';
import { cloudApi } from '../services/cloudApi';
import { isWeb } from '../services/platform';
import { getApiBase } from '../config';
import { useProjectStore } from '../stores/projectStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { ProjectInfo } from '../services/api';
import { importProjectFromZip } from '../utils/zipImport';
import { showToast } from './Toast';

type ProjectSource = 'local' | 'cloud';

/** Web is always cloud; the toggle would be misleading. */
const WEB_ONLY_CLOUD = isWeb();

const ITEM_COLORS = [
  '#e06060', '#e89b4f', '#f4d35e', '#6abf69',
  '#4a9eff', '#6fa8dc', '#b58ee0', '#9370DB',
  '#e06c9f', '#d4a373', '#95a5a6', '',
];

type SortKey = 'custom' | 'name' | 'created' | 'updated' | 'color';

interface ProjectWithCount extends ProjectInfo {
  script_count: number;
}

// ── Sortable card wrapper ────────────────────────────────────────────────

interface SortableCardProps {
  project: ProjectWithCount;
  sortKey: SortKey;
  source: ProjectSource;
  onNavigate: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  formatDate: (iso: string) => string;
}

const SortableCard: React.FC<SortableCardProps> = ({
  project,
  sortKey,
  source,
  onNavigate,
  onPin,
  onColor,
  onDelete,
  onRename,
  formatDate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, disabled: sortKey !== 'custom' });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Close the actions dropdown when clicking outside the card. Without this,
  // the menu stays open as the user moves around the page.
  React.useEffect(() => {
    if (!showActions) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showActions]);

  const handleRenameSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== project.name) {
      onRename(project.id, trimmed);
    } else {
      setEditName(project.name);
    }
    setEditing(false);
  };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined,
  };

  return (
    <div
      ref={(node) => { setNodeRef(node); cardRef.current = node; }}
      style={style}
      className={`relative bg-(--fd-navigator-bg) border rounded-lg p-5 cursor-default transition-[border-color,box-shadow] duration-150 overflow-visible hover:border-(--fd-accent) hover:shadow-[0_4px_12px_rgba(74,158,255,0.1)] has-[.script-card-dropdown]:z-10 max-md:p-4 ${project.pinned ? 'border-[rgba(244,211,94,0.4)]' : 'border-(--fd-border)'}`}
    >
      {/* Color stripe */}
      {project.color && (
        <div
          className="absolute inset-x-0 top-0 h-1 rounded-t-lg"
          style={{ backgroundColor: project.color }}
        />
      )}

      {/* Drag handle */}
      {sortKey === 'custom' && (
        <div className="cursor-grab text-(--fd-text-muted) text-sm py-0.5 px-1.5 rounded-[3px] select-none shrink-0 hover:text-(--fd-text) hover:bg-(--fd-overlay-subtle) active:cursor-grabbing" {...attributes} {...listeners} title="Drag to reorder">
          &#x2630;
        </div>
      )}

      {/* Card body — clicking navigates, double-click name to rename */}
      <div className="cursor-pointer" onClick={() => !editing && onNavigate(project.id)}>
        {editing ? (
          <input
            className="bg-transparent border border-(--fd-accent) rounded-[3px] text-(--fd-text) font-[inherit] py-0.5 px-1 w-full outline-none box-border"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') { setEditName(project.name); setEditing(false); }
            }}
            onBlur={handleRenameSubmit}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div
            className="text-[17px] font-semibold text-(--fd-text) mb-2 max-md:text-[15px]"
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); setEditName(project.name); }}
            title="Double-click to rename"
          >
            {project.name}
          </div>
        )}
        <div className="text-[13px] text-(--fd-text-muted) flex items-center gap-1.5 leading-normal">
          <span>
            {project.script_count} screenplay{project.script_count !== 1 ? 's' : ''}
          </span>
          <span className="text-(--fd-text-muted)">&middot;</span>
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-[0.4px] border ${source === 'cloud' ? 'text-[#5aa9ff] border-[rgba(90,169,255,0.4)] bg-[rgba(90,169,255,0.08)]' : 'border-(--fd-border) bg-(--fd-bg) text-(--fd-text-muted)'}`}
            title={source === 'cloud' ? 'Stored on OpenDraft Cloud' : 'Stored on this device'}
          >
            {source === 'cloud' ? <FaCloud /> : <FaDesktop />}
            {source === 'cloud' ? 'Cloud' : 'Local'}
          </span>
        </div>
        <div className="text-[13px] text-(--fd-text-muted) flex items-center gap-1.5 leading-normal">
          <span>Created {formatDate(project.created_at)}</span>
          <span className="text-(--fd-text-muted)">&middot;</span>
          <span>Modified {formatDate(project.updated_at)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1 mt-2.5 max-md:gap-1.5">
        <button
          className={`bg-transparent border-0 text-(--fd-text-muted) text-xs py-0.75 px-1.5 rounded-[3px] cursor-pointer transition-all duration-100 hover:text-(--fd-text) hover:bg-(--fd-overlay-light) max-md:w-9 max-md:h-9 max-md:min-w-9 ${project.pinned ? 'text-[#f4d35e]' : ''}`}
          onClick={(e) => { e.stopPropagation(); onPin(project.id, !project.pinned); }}
          title={project.pinned ? 'Unpin' : 'Pin to top'}
        >
          &#x1F4CC;
        </button>
        <button
          className="bg-transparent border-0 text-(--fd-text-muted) text-xs py-0.75 px-1.5 rounded-[3px] cursor-pointer transition-all duration-100 hover:text-(--fd-text) hover:bg-(--fd-overlay-light) max-md:w-9 max-md:h-9 max-md:min-w-9"
          onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
          title="Set color"
        >
          <span
            className="inline-block w-3 h-3 rounded-full border border-[rgba(255,255,255,0.15)]"
            style={{ backgroundColor: project.color || '#666' }}
          />
        </button>
        <button
          className="bg-transparent border-0 text-(--fd-text-muted) py-0.75 px-1.5 rounded-[3px] cursor-pointer transition-all duration-100 hover:text-(--fd-text) hover:bg-(--fd-overlay-light) max-md:w-9 max-md:h-9 max-md:min-w-9 text-base font-bold leading-none"
          onClick={(e) => { e.stopPropagation(); setShowActions((v) => !v); }}
          title="More actions"
          aria-haspopup="menu"
          aria-expanded={showActions}
        >
          &#x22EE;
        </button>
      </div>

      {/* Actions dropdown — Rename and Delete are reachable regardless of
          whether the project has scripts. Confirmation for non-empty
          projects is handled by the parent's pendingDelete dialog. */}
      {showActions && (
        <div className="script-actions-dropdown script-card-dropdown absolute right-2 top-auto bottom-14 mt-0 bg-(--fd-toolbar-bg) border border-(--fd-border) rounded-md py-1 z-200 min-w-45 max-md:min-w-50 shadow-[0_4px_12px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()} role="menu">
          <div
            className="py-2 px-3.5 text-[13px] text-(--fd-text) cursor-pointer transition-colors duration-100 hover:bg-(--fd-overlay-light) max-md:min-h-11 max-md:py-3 max-md:px-3.5 max-md:text-sm"
            role="menuitem"
            onClick={() => { setShowActions(false); setEditing(true); setEditName(project.name); }}
          >
            Rename
          </div>
          <div className="h-px bg-(--fd-border) my-1" />
          <div
            className="py-2 px-3.5 text-[13px] cursor-pointer transition-colors duration-100 max-md:min-h-11 max-md:py-3 max-md:px-3.5 max-md:text-sm text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)]"
            role="menuitem"
            onClick={() => { setShowActions(false); onDelete(project.id); }}
          >
            Delete
          </div>
        </div>
      )}

      {/* Color picker dropdown */}
      {showColorPicker && (
        <div className="absolute right-2.5 bottom-2.5 flex flex-wrap gap-1 bg-(--fd-toolbar-bg) border border-(--fd-border) rounded-md p-1.5 z-100 w-35 shadow-[0_4px_12px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
          {ITEM_COLORS.map((c) => (
            <button
              key={c || 'none'}
              className={`w-6 h-6 rounded-full border-2 border-transparent cursor-pointer transition-transform duration-100 relative hover:scale-[1.2] ${project.color === c ? 'border-white shadow-[0_0_0_1px_var(--fd-accent)]' : ''}`}
              style={{ backgroundColor: c || '#555' }}
              onClick={() => { onColor(project.id, c); setShowColorPicker(false); }}
              title={c || 'No color'}
            >
              {!c && <span className="absolute inset-0 flex items-center justify-center text-[10px] text-[#aaa]">&#x2715;</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [source, setSource] = useState<ProjectSource>(() => {
    if (WEB_ONLY_CLOUD) return 'cloud';
    return ((localStorage.getItem('opendraft:projectSource') as ProjectSource) || 'local');
  });
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    return (localStorage.getItem('opendraft:projectSort') as SortKey) || 'custom';
  });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const accessToken = useSettingsStore((s) => s.collabAuth.accessToken);
  const authVerified = useSettingsStore((s) => s.authVerified);
  const signedIn = Boolean(accessToken && authVerified);
  const syncCloudProjects = useProjectStore((s) => s.syncCloudProjects);
  const markCloudProject = useProjectStore((s) => s.markCloudProject);
  const unmarkCloudProject = useProjectStore((s) => s.unmarkCloudProject);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Persist the chosen tab so reopening the app remembers what the user was
  // browsing last. Web stays locked to 'cloud' so we don't clobber that.
  useEffect(() => {
    if (!WEB_ONLY_CLOUD) {
      try { localStorage.setItem('opendraft:projectSource', source); } catch { /* ignore */ }
    }
  }, [source]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Cloud listing requires a verified login. Empty state with a hint is
      // better than a confusing "no projects" when the user just hasn't
      // signed in yet.
      if (source === 'cloud' && !signedIn) {
        setProjects([]);
        setLoading(false);
        return;
      }
      const client = source === 'cloud' ? cloudApi : api;
      const projectList = await client.listProjects();
      // Keep the cloud-project marker set in sync with what the server
      // currently returns. ProjectView reads this to dispatch reads/writes
      // to cloudApi.
      if (source === 'cloud') {
        syncCloudProjects(projectList.map((p) => p.id));
      }
      const withCounts: ProjectWithCount[] = await Promise.all(
        projectList.map(async (p) => {
          try {
            const scripts = await client.listScripts(p.id);
            return { ...p, script_count: scripts.length };
          } catch {
            return { ...p, script_count: 0 };
          }
        }),
      );
      setProjects(withCounts);
    } catch (err) {
      setProjects([]);
      setErrorMsg(err instanceof Error ? err.message : 'Could not load projects');
    }
    setLoading(false);
  }, [source, signedIn, syncCloudProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    localStorage.setItem('opendraft:projectSort', sortKey);
  }, [sortKey]);

  // ── Sorting ──

  const { pinnedProjects, unpinnedProjects } = React.useMemo(() => {
    const list = [...projects];

    const compareFn = (a: ProjectWithCount, b: ProjectWithCount): number => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'color':
          return (a.color || 'zzz').localeCompare(b.color || 'zzz');
        case 'custom':
        default:
          return a.sort_order - b.sort_order;
      }
    };

    // Pinned items sorted by sort_order only, unpinned by user-selected sort
    const pinned = list.filter((p) => p.pinned).sort((a, b) => a.sort_order - b.sort_order);
    const unpinned = list.filter((p) => !p.pinned).sort(compareFn);
    return { pinnedProjects: pinned, unpinnedProjects: unpinned };
  }, [projects, sortKey]);

  const allSortedProjects = React.useMemo(
    () => [...pinnedProjects, ...unpinnedProjects],
    [pinnedProjects, unpinnedProjects],
  );

  // ── Handlers ──

  /** All mutations route through whichever backend currently owns this view.
   *  Cloud view → cloudApi. Local view → api (local SQLite on Tauri). */
  const client = source === 'cloud' ? cloudApi : api;

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    if (source === 'cloud' && !signedIn) {
      window.dispatchEvent(new CustomEvent('opendraft:auth-required'));
      return;
    }
    setCreating(true);
    try {
      const created = await client.createProject(newProjectName.trim());
      if (source === 'cloud') markCloudProject(created.id);
      setShowNewDialog(false);
      setNewProjectName('');
      await fetchProjects();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create project', 'error');
    }
    setCreating(false);
  };

  const handleRename = useCallback(
    async (id: string, name: string) => {
      const prev = projects.find((p) => p.id === id);
      setProjects((list) =>
        list.map((p) => (p.id === id ? { ...p, name } : p)),
      );
      try {
        await client.updateProject(id, { name });
      } catch {
        if (prev) {
          setProjects((list) =>
            list.map((p) => (p.id === id ? { ...p, name: prev.name } : p)),
          );
        }
      }
    },
    [projects, client],
  );

  const handlePin = useCallback(
    async (id: string, pinned: boolean) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, pinned } : p)),
      );
      try {
        await client.updateProject(id, { pinned });
      } catch {
        // revert on failure
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, pinned: !pinned } : p)),
        );
      }
    },
    [client],
  );

  const handleColor = useCallback(
    async (id: string, color: string) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, color } : p)),
      );
      try {
        await client.updateProject(id, { color });
      } catch {
        // silently fail — color already updated visually
      }
    },
    [client],
  );

  const handleDelete = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    try {
      await client.deleteProject(pendingDeleteId);
      if (source === 'cloud') unmarkCloudProject(pendingDeleteId);
      showToast('Project deleted', 'success');
      await fetchProjects();
    } catch (err) {
      showToast(
        `Delete failed: ${err instanceof Error ? err.message : String(err)}`,
        'error',
      );
    }
    setPendingDeleteId(null);
  }, [pendingDeleteId, fetchProjects, client, source, unmarkCloudProject]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = allSortedProjects.findIndex((p) => p.id === active.id);
      const newIndex = allSortedProjects.findIndex((p) => p.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const reordered = [...allSortedProjects];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      // Assign new sort_order values
      const updated = reordered.map((p, i) => ({ ...p, sort_order: i }));
      setProjects(updated);

      // Persist
      client.reorderProjects(updated.map((p) => ({ id: p.id, sort_order: p.sort_order }))).catch(() => {});
    },
    [allSortedProjects, client],
  );

  const formatDate = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="h-full bg-(--fd-bg) text-(--fd-text) p-10 overflow-y-auto box-border max-md:px-3 max-md:py-4">
      {!WEB_ONLY_CLOUD && (
        <div className="flex gap-0 max-w-300 mx-auto mb-6 border-b border-(--fd-border) max-md:mb-4 max-md:overflow-x-auto max-md:scrollbar-none max-md:[&::-webkit-scrollbar]:hidden" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={source === 'local'}
            className="inline-flex items-center gap-1.5 px-5 py-3 bg-transparent border-0 border-b-2 border-transparent -mb-px text-(--fd-text-muted) text-sm font-semibold cursor-pointer transition-colors duration-150 hover:text-(--fd-text) aria-selected:text-(--fd-accent) aria-selected:border-(--fd-accent) max-md:flex-1 max-md:basis-1/2 max-md:justify-center max-md:px-2.5 max-md:min-h-11 max-md:whitespace-nowrap"
            onClick={() => setSource('local')}
          >
            <FaDesktop /> This device
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={source === 'cloud'}
            className="inline-flex items-center gap-1.5 px-5 py-3 bg-transparent border-0 border-b-2 border-transparent -mb-px text-(--fd-text-muted) text-sm font-semibold cursor-pointer transition-colors duration-150 hover:text-(--fd-text) aria-selected:text-(--fd-accent) aria-selected:border-(--fd-accent) max-md:flex-1 max-md:basis-1/2 max-md:justify-center max-md:px-2.5 max-md:min-h-11 max-md:whitespace-nowrap"
            onClick={() => setSource('cloud')}
          >
            <FaCloud /> OpenDraft Cloud
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-10 max-w-300 mx-auto max-md:mb-5 max-md:flex-col max-md:gap-3 max-md:items-stretch">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold text-(--fd-text) tracking-[-0.5px] max-md:text-[22px] max-[480px]:text-[20px]">Projects</h1>
          <span className="text-sm text-(--fd-text-muted)">
            {source === 'cloud' ? 'OpenDraft Cloud' : 'On this device'}
            {source === 'cloud' && getApiBase() && (
              <>
                {' · '}
                <span title="Server this app is talking to">{getApiBase()}</span>
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2.5 max-md:flex-wrap max-md:gap-2">
          <select
            className="h-8 px-2.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs cursor-pointer max-md:flex-1 max-md:basis-full max-md:h-11 max-md:text-sm"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="custom">Custom Order</option>
            <option value="name">Name</option>
            <option value="created">Created</option>
            <option value="updated">Last Modified</option>
            <option value="color">Color</option>
          </select>
          {source === 'local' && (
            <button
              className="h-9 px-5 bg-transparent! text-(--fd-text-muted)! border border-(--fd-border)! rounded-md text-[13px] font-semibold cursor-pointer transition-opacity duration-150 hover:bg-(--fd-menu-hover)! hover:text-(--fd-text)! max-md:flex-1 max-md:min-w-0 max-md:h-11 max-md:text-sm"
              onClick={async () => {
                try {
                  const { openBinaryFile } = await import('../utils/fileOps');
                  const result = await openBinaryFile([
                    { name: 'ZIP Archive', extensions: ['zip'] },
                  ]);
                  if (!result) return;
                  const newId = await importProjectFromZip(result.content);
                  await fetchProjects();
                  showToast('Project imported', 'success');
                  navigate(`/project/${newId}`);
                } catch (err) {
                  showToast(
                    `Import failed: ${err instanceof Error ? err.message : String(err)}`,
                    'error',
                  );
                }
              }}
            >
              Import Project
            </button>
          )}
          <button
            className="h-9 px-5 bg-(--fd-accent) text-white border-0 rounded-md text-[13px] font-semibold cursor-pointer transition-opacity duration-150 hover:opacity-85 max-md:flex-1 max-md:min-w-0 max-md:h-11 max-md:text-sm"
            onClick={() => setShowNewDialog(true)}
          >
            + New Project
          </button>
        </div>
      </div>

      {loading ? (
        <div className="max-w-300 my-20 mx-auto text-center text-(--fd-text-muted) text-sm">Loading projects...</div>
      ) : source === 'cloud' && !signedIn ? (
        <div className="max-w-300 my-20 mx-auto text-center text-(--fd-text-muted) text-sm">
          <div className="text-[48px] mb-4 opacity-50">&#9729;</div>
          <div>Sign in to access OpenDraft Cloud projects. Click the "Local only" indicator at the top to sign in.</div>
        </div>
      ) : errorMsg ? (
        <div className="max-w-300 my-20 mx-auto text-center text-(--fd-text-muted) text-sm">
          <div className="text-[48px] mb-4 opacity-50">&#9888;</div>
          <div>{errorMsg}</div>
        </div>
      ) : projects.length === 0 ? (
        <div className="max-w-300 my-20 mx-auto text-center text-(--fd-text-muted) text-sm">
          <div className="text-[48px] mb-4 opacity-50">&#128209;</div>
          <div>
            {source === 'cloud'
              ? (WEB_ONLY_CLOUD
                  ? 'No projects yet. Create your first project to get started.'
                  : 'No cloud projects yet. Create one or upload via File › Save As… and pick OpenDraft Cloud.')
              : 'No projects yet. Create your first project to get started.'}
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {pinnedProjects.length > 0 && (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-[0.8px] py-2 mt-4 mb-1 max-w-300 mx-auto first:mt-0 text-[#f4d35e]">Pinned</div>
              <SortableContext
                items={pinnedProjects.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 max-w-300 mx-auto max-md:grid-cols-1 max-md:gap-3">
                  {pinnedProjects.map((project) => (
                    <SortableCard
                      key={project.id}
                      project={project}
                      sortKey={sortKey}
                      source={source}
                      onNavigate={(id) => navigate(`/project/${id}`)}
                      onPin={handlePin}
                      onColor={handleColor}
                      onDelete={handleDelete}
                      onRename={handleRename}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </SortableContext>
            </>
          )}
          {unpinnedProjects.length > 0 && (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-[0.8px] py-2 mt-4 mb-1 max-w-300 mx-auto first:mt-0 text-(--fd-text-muted)">All Projects</div>
              <SortableContext
                items={unpinnedProjects.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 max-w-300 mx-auto max-md:grid-cols-1 max-md:gap-3">
                  {unpinnedProjects.map((project) => (
                    <SortableCard
                      key={project.id}
                      project={project}
                      sortKey={sortKey}
                      source={source}
                      onNavigate={(id) => navigate(`/project/${id}`)}
                      onPin={handlePin}
                      onColor={handleColor}
                      onDelete={handleDelete}
                      onRename={handleRename}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </SortableContext>
            </>
          )}
        </DndContext>
      )}

      {/* New Project Dialog */}
      {showNewDialog && (
        <div className="fixed left-0 top-0 right-0 bg-black/50 z-3000 flex items-start justify-center h-(--vv-height,100dvh) pt-[5vh] px-4 pb-4 overflow-y-auto" onClick={() => setShowNewDialog(false)}>
          <div className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[320px] max-w-[400px] max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col max-md:min-w-0 max-md:max-w-none max-md:w-[calc(100vw-32px-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))]" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header py-3.5 px-5 border-b border-(--fd-border) font-semibold text-base shrink-0">New Project</div>
            <div className="dialog-body p-5 overflow-y-auto flex-1">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-(--fd-text-muted)">Project Name:</label>
                <input
                  type="text"
                  className="h-9 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-sm outline-none px-2.5 focus:border-(--fd-accent) max-md:h-10 max-md:text-base"
                  placeholder="My Screenplay"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateProject();
                    if (e.key === 'Escape') setShowNewDialog(false);
                  }}
                  autoFocus
                />
              </div>
            </div>
            <div className="dialog-actions flex justify-end gap-2 py-3.5 px-5 border-t border-(--fd-border) shrink-0 [&_button]:h-8.5 [&_button]:px-4.5 [&_button]:bg-(--fd-toolbar-bg) [&_button]:text-(--fd-text) [&_button]:border [&_button]:border-(--fd-border) [&_button]:rounded [&_button]:cursor-pointer [&_button]:text-sm [&_button:hover]:bg-(--fd-menu-hover)">
              <button onClick={() => setShowNewDialog(false)}>Cancel</button>
              <button
                className="bg-(--fd-accent)! border-(--fd-accent)! text-white! hover:opacity-90"
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {pendingDeleteId && (
        <div className="fixed left-0 top-0 right-0 bg-black/50 z-3000 flex items-start justify-center h-(--vv-height,100dvh) pt-[5vh] px-4 pb-4 overflow-y-auto" onClick={() => setPendingDeleteId(null)}>
          <div className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[320px] max-w-[400px] max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col max-md:min-w-0 max-md:max-w-none max-md:w-[calc(100vw-32px-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))]" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header py-3.5 px-5 border-b border-(--fd-border) font-semibold text-base shrink-0">Delete Project</div>
            <div className="dialog-body p-5 overflow-y-auto flex-1">
              <p>
                Are you sure you want to delete this project? This cannot be
                undone.
              </p>
            </div>
            <div className="dialog-actions flex justify-end gap-2 py-3.5 px-5 border-t border-(--fd-border) shrink-0 [&_button]:h-8.5 [&_button]:px-4.5 [&_button]:bg-(--fd-toolbar-bg) [&_button]:text-(--fd-text) [&_button]:border [&_button]:border-(--fd-border) [&_button]:rounded [&_button]:cursor-pointer [&_button]:text-sm [&_button:hover]:bg-(--fd-menu-hover)">
              <button onClick={() => setPendingDeleteId(null)}>Cancel</button>
              <button
                className="bg-[#c0392b]! border-[#c0392b]! text-white! hover:opacity-90"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
