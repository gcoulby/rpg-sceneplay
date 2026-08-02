import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JSONContent } from '@tiptap/react';
import { useProjectStore } from '../stores/projectStore';
import { api } from '../services/api';
import type { VersionInfo } from '../services/api';
import DiffViewer from './DiffViewer';
import ScriptDiffView from './ScriptDiffView';
import { showToast } from './Toast';
import { relativeTime } from '../utils/relativeTime';


const VersionHistory: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject, currentScriptId, versions, setVersions, versionHistoryOpen, setVersionHistoryOpen, triggerScriptReload } =
    useProjectStore();

  const [selectedVersion, setSelectedVersion] = useState<VersionInfo | null>(null);
  const [diffText, setDiffText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compare mode — checkboxes on version rows
  const [compareSelection, setCompareSelection] = useState<string[]>([]);  // commit hashes
  const [scriptDiff, setScriptDiff] = useState<{
    docA: Record<string, unknown>;
    docB: Record<string, unknown>;
    labelA: string;
    labelB: string;
  } | null>(null);

  const toggleCompareSelect = useCallback((hash: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(hash)) return prev.filter((h) => h !== hash);
      if (prev.length >= 2) return [prev[1], hash]; // drop oldest, keep rolling window of 2
      return [...prev, hash];
    });
  }, []);

  const runScriptCompare = useCallback(async () => {
    if (!currentProject || !currentScriptId || compareSelection.length !== 2) return;
    try {
      const vA = versions.find((v) => v.hash === compareSelection[0]);
      const vB = versions.find((v) => v.hash === compareSelection[1]);
      if (!vA || !vB) {
        showToast('Selected versions no longer available', 'error');
        return;
      }
      // Order: earlier version = A, later = B
      const aIsEarlier = new Date(vA.date).getTime() < new Date(vB.date).getTime();
      const earlier = aIsEarlier ? vA : vB;
      const later = aIsEarlier ? vB : vA;

      // Fetch each version independently so a 404 on one side shows as an
      // "Added in this version" / "Removed before this version" state rather
      // than killing the whole compare.
      const fetchOrNull = async (hash: string) => {
        try {
          return await api.getScriptAtVersion(currentProject.id, hash, currentScriptId);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes('404') || /not found/i.test(msg)) return null;
          throw e;
        }
      };

      const [respA, respB] = await Promise.all([
        fetchOrNull(earlier.hash),
        fetchOrNull(later.hash),
      ]);

      if (!respA && !respB) {
        showToast(
          `This script does not exist in either selected version.`,
          'error',
        );
        return;
      }
      if (!respA) {
        showToast(
          `Script was added in ${later.short_hash}. It does not exist in ${earlier.short_hash}.`,
          'info',
        );
      }
      if (!respB) {
        showToast(
          `Script was removed before ${later.short_hash}. Showing only ${earlier.short_hash}.`,
          'info',
        );
      }

      const emptyDoc = { type: 'doc', content: [] };
      setScriptDiff({
        docA: (respA?.content || emptyDoc) as Record<string, unknown>,
        docB: (respB?.content || emptyDoc) as Record<string, unknown>,
        labelA: respA
          ? `${earlier.short_hash} · ${earlier.message}`
          : `${earlier.short_hash} · (script not in this version)`,
        labelB: respB
          ? `${later.short_hash} · ${later.message}`
          : `${later.short_hash} · (script not in this version)`,
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load versions for comparison',
        'error',
      );
    }
  }, [currentProject, currentScriptId, compareSelection, versions]);

  // Load versions when panel opens
  const loadVersions = useCallback(async () => {
    if (!currentProject) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVersions(currentProject.id, currentScriptId || undefined);
      setVersions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  }, [currentProject, currentScriptId, setVersions]);

  useEffect(() => {
    if (versionHistoryOpen && currentProject) {
      loadVersions();
    }
  }, [versionHistoryOpen, currentProject, loadVersions]);

  const handleViewDiff = useCallback(
    async (version: VersionInfo, index: number) => {
      if (!currentProject) return;
      setSelectedVersion(version);

      // Diff against previous commit (or show first commit as-is)
      if (index >= versions.length - 1) {
        setDiffText('(Initial version -- no previous version to compare against)');
        return;
      }

      const prevVersion = versions[index + 1]; // versions are newest-first
      try {
        const result = await api.getVersionDiff(currentProject.id, prevVersion.hash, version.hash);
        setDiffText(result.diff || '(No changes)');
      } catch (err) {
        setDiffText(`Error loading diff: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    },
    [currentProject, versions]
  );

  const [restoreConfirm, setRestoreConfirm] = useState<VersionInfo | null>(null);

  const handleRestore = useCallback(
    (version: VersionInfo) => {
      setRestoreConfirm(version);
    },
    []
  );

  const handleRestoreConfirm = useCallback(
    async () => {
      if (!currentProject || !restoreConfirm) return;
      const version = restoreConfirm;
      setRestoreConfirm(null);
      try {
        await api.restoreVersion(currentProject.id, version.hash);
        await loadVersions();
        setSelectedVersion(null);
        setDiffText(null);

        // Check if the current script still exists after restore
        if (currentScriptId) {
          try {
            await api.getScript(currentProject.id, currentScriptId);
            // Script still exists — reload it in the editor
            triggerScriptReload();
          } catch {
            // Script was removed by the restore — go to project view
            setVersionHistoryOpen(false);
            navigate(`/project/${currentProject.id}`, { replace: true });
            showToast(`Restored to version ${version.short_hash}. The open script no longer exists in this version.`, 'info');
            return;
          }
        } else {
          triggerScriptReload();
        }
        showToast(`Restored to version ${version.short_hash}`, 'success');
      } catch (err) {
        showToast(`Restore failed: ${err instanceof Error ? err.message : 'unknown error'}`, 'error');
      }
    },
    [currentProject, currentScriptId, restoreConfirm, loadVersions, navigate, setVersionHistoryOpen, triggerScriptReload]
  );

  if (!versionHistoryOpen) return null;

  return (
    <div className="version-history-panel fixed top-0 right-0 w-[420px] h-screen bg-(--fd-navigator-bg) border-l border-(--fd-border) flex flex-col z-[3000] shadow-[-4px_0_20px_rgba(0,0,0,.4)]">
      <div className="flex justify-between items-center px-4 py-3 border-b border-(--fd-border) shrink-0">
        <span className="font-semibold text-[13px] uppercase tracking-[0.5px] text-(--fd-text)">Version History</span>
        <button
          className="version-history-close bg-transparent border-none text-(--fd-text-muted) text-base cursor-pointer px-1.5 py-0.5 rounded-[3px] hover:bg-(--fd-menu-hover) hover:text-(--fd-text)"
          onClick={() => {
            setVersionHistoryOpen(false);
            setSelectedVersion(null);
            setDiffText(null);
          }}
        >
          x
        </button>
      </div>

      {!currentProject && (
        <div className="px-4 py-5 text-(--fd-text-muted) text-xs italic text-center">
          No project selected. Import or create a screenplay first.
        </div>
      )}

      {error && <div className="px-4 py-5 text-[#ff6b6b] text-xs italic text-center">{error}</div>}

      {loading && <div className="px-4 py-5 text-(--fd-text-muted) text-xs italic text-center">Loading versions...</div>}

      {currentScriptId && versions.length >= 2 && (
        <div className="flex items-center gap-[10px] px-3.5 py-2 border-b border-(--fd-border) bg-(--fd-overlay-subtle) shrink-0 flex-wrap">
          <span className="flex-1 text-[11px] text-(--fd-text-muted)">
            {compareSelection.length === 0 && 'Check two versions to compare'}
            {compareSelection.length === 1 && 'Select one more version to compare'}
            {compareSelection.length === 2 && 'Ready to compare'}
          </span>
          <button
            className="bg-(--fd-accent) text-white border-none px-3 py-[5px] rounded-[4px] cursor-pointer text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={compareSelection.length !== 2}
            onClick={runScriptCompare}
          >
            Compare Selected
          </button>
          {compareSelection.length > 0 && (
            <button
              className="bg-transparent border border-(--fd-border) text-(--fd-text-muted) px-2.5 py-1 rounded-[4px] cursor-pointer text-[11px]"
              onClick={() => setCompareSelection([])}
            >
              Clear
            </button>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="version-history-list flex-1 overflow-y-auto py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-thumb]:rounded-[3px]">
          {versions.length === 0 && !loading && currentProject && (
            <div className="px-4 py-5 text-(--fd-text-muted) text-xs italic text-center">
              No versions yet. Use File &gt; Check In to save a version.
            </div>
          )}
          {versions.map((v, i) => {
            const isSelected = selectedVersion?.hash === v.hash;
            const isCompareSelected = compareSelection.includes(v.hash);
            return (
              <div
                key={v.hash}
                className={`version-item px-4 py-2.5 border-b border-(--fd-overlay-subtle) cursor-pointer transition-[background] duration-100 relative ${
                  isSelected
                    ? 'bg-[rgba(74,158,255,0.15)] border-l-[3px] border-l-(--fd-accent)'
                    : isCompareSelected
                    ? 'bg-(--fd-overlay-light) border-l-[3px] border-l-(--fd-accent)'
                    : 'hover:bg-[rgba(74,158,255,0.08)]'
                }`}
                onClick={() => handleViewDiff(v, i)}
              >
                <div className="flex justify-between items-center mb-1">
                  {currentScriptId && (
                    <input
                      type="checkbox"
                      className="mr-1.5 cursor-pointer"
                      checked={compareSelection.includes(v.hash)}
                      onChange={(e) => { e.stopPropagation(); toggleCompareSelect(v.hash); }}
                      onClick={(e) => e.stopPropagation()}
                      title="Select for compare"
                    />
                  )}
                  <span className="font-mono text-[11px] text-(--fd-accent) font-semibold">{v.short_hash}</span>
                  <span className="text-[11px] text-(--fd-text-muted)">{relativeTime(v.date)}</span>
                </div>
                <div className="text-xs text-(--fd-text) leading-[1.4] mb-1.5">{v.message}</div>
                <div className="flex gap-1.5">
                  {currentScriptId && (
                    <button
                      className="bg-transparent border border-(--fd-border) text-(--fd-text-muted) text-[10px] px-2 py-0.5 rounded-[3px] cursor-pointer transition-all duration-150 hover:border-[#e5a50a] hover:text-[#e5a50a] hover:bg-[rgba(229,165,10,0.1)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentProject && currentScriptId) {
                          setVersionHistoryOpen(false);
                          setSelectedVersion(null);
                          setDiffText(null);
                          navigate(`/project/${currentProject.id}/history/${currentScriptId}/${v.hash}`);
                        }
                      }}
                      title="View this version in the editor (read-only)"
                    >
                      View
                    </button>
                  )}
                  <button
                    className="version-restore-btn bg-transparent border border-(--fd-border) text-(--fd-text-muted) text-[10px] px-2 py-0.5 rounded-[3px] cursor-pointer transition-all duration-150 hover:border-(--fd-accent) hover:text-(--fd-accent) hover:bg-[rgba(74,158,255,0.1)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(v);
                    }}
                    title="Restore this version"
                  >
                    Restore
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {diffText !== null && selectedVersion && (
          <div className="border-t border-(--fd-border) max-h-1/2 flex flex-col shrink-0">
            <div className="flex justify-between items-center px-4 py-2 text-[11px] text-(--fd-text-muted) border-b border-(--fd-border) shrink-0">
              <span>
                Changes in {selectedVersion.short_hash}: {selectedVersion.message}
              </span>
              <button
                className="bg-transparent border-none text-(--fd-text-muted) text-sm cursor-pointer px-1.5 py-0.5 rounded-[3px] hover:bg-(--fd-menu-hover) hover:text-(--fd-text)"
                onClick={() => {
                  setSelectedVersion(null);
                  setDiffText(null);
                }}
              >
                x
              </button>
            </div>
            <DiffViewer diff={diffText} />
          </div>
        )}
      </div>
      {scriptDiff && (
        <div className="fixed inset-0 z-[200] bg-(--fd-background)">
          <ScriptDiffView
            docA={scriptDiff.docA as JSONContent}
            docB={scriptDiff.docB as JSONContent}
            labelA={scriptDiff.labelA}
            labelB={scriptDiff.labelB}
            onClose={() => setScriptDiff(null)}
          />
        </div>
      )}
      {restoreConfirm && (
        <div
          className="dialog-overlay fixed left-0 top-0 right-0 bg-black/50 z-[3000] flex items-start justify-center h-[var(--vv-height,100dvh)] px-4 pt-[5vh] pb-4 overflow-y-auto"
          onClick={() => setRestoreConfirm(null)}
        >
          <div
            className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,.6)] min-w-[320px] max-w-[400px] max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header px-5 py-3.5 border-b border-(--fd-border) font-semibold text-base shrink-0">Restore Version</div>
            <div className="dialog-body p-5 overflow-y-auto flex-1">
              <p style={{ margin: 0 }}>
                Restore to version <strong>{restoreConfirm.short_hash}</strong>?
                This will create a new version with the restored content.
              </p>
            </div>
            <div className="dialog-actions flex justify-end gap-2 px-5 py-3.5 border-t border-(--fd-border) shrink-0 [&_button]:h-[34px] [&_button]:px-[18px] [&_button]:bg-(--fd-toolbar-bg) [&_button]:text-(--fd-text) [&_button]:border [&_button]:border-(--fd-border) [&_button]:rounded [&_button]:cursor-pointer [&_button]:text-sm [&_button]:hover:bg-(--fd-menu-hover)">
              <button onClick={() => setRestoreConfirm(null)}>Cancel</button>
              <button className="bg-(--fd-accent)! border-(--fd-accent)! text-white! hover:opacity-90" onClick={handleRestoreConfirm}>
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionHistory;
