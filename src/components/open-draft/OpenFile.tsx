/**
 * OpenFile — unified Open dialog replacing the separate Open-from-Project and
 * Open-from-Cloud dialogs.
 *
 * On the desktop / mobile app:
 *   - Source toggle at the top (This device / OpenDraft Cloud).
 *   - "This device" reads via `api` which is swapped to local SQLite.
 *   - "OpenDraft Cloud" reads via `cloudApi` (HTTP + auth).
 * In the browser:
 *   - No toggle — everything on the web is cloud-backed. We always go through
 *     `cloudApi` since that's the only real source.
 *
 * Also adds:
 *   - Search box that filters both project and script titles.
 *   - Sort options: name A-Z / Z-A, updated recent first / oldest first,
 *     created recent first.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { FaCloud, FaDesktop, FaSearch } from 'react-icons/fa'
import { api } from '@/services/api'
import { cloudApi } from '@/services/cloudApi'
import { isWeb } from '@/services/platform'
import { useSettingsStore } from '@/stores/settingsStore'
import type { ProjectInfo, ScriptMeta } from '@/services/api'

export type OpenSource = 'local' | 'cloud'

interface ProjectWithScripts {
  project: ProjectInfo
  scripts: ScriptMeta[]
}

interface OpenFileProps {
  onOpen: (
    projectId: string,
    project: ProjectInfo,
    scriptId: string,
    scriptTitle: string,
    source: OpenSource,
  ) => void
  onClose: () => void
}

type SortKey =
  | 'updated_desc'
  | 'updated_asc'
  | 'created_desc'
  | 'name_asc'
  | 'name_desc'

const SORT_LABELS: Record<SortKey, string> = {
  updated_desc: 'Last modified (newest)',
  updated_asc: 'Last modified (oldest)',
  created_desc: 'Date created (newest)',
  name_asc: 'Name (A → Z)',
  name_desc: 'Name (Z → A)',
}

function compareScripts(a: ScriptMeta, b: ScriptMeta, sort: SortKey): number {
  switch (sort) {
    case 'name_asc':
      return a.title.localeCompare(b.title)
    case 'name_desc':
      return b.title.localeCompare(a.title)
    case 'updated_asc':
      return (a.updated_at || '').localeCompare(b.updated_at || '')
    case 'created_desc':
      return (b.created_at || '').localeCompare(a.created_at || '')
    case 'updated_desc':
    default:
      return (b.updated_at || '').localeCompare(a.updated_at || '')
  }
}

/** Web is always cloud. Desktop/mobile apps let the user pick. */
const WEB_ONLY_CLOUD = isWeb()

const OpenFile: React.FC<OpenFileProps> = ({ onOpen, onClose }) => {
  // Only treat the user as signed in once the token has been verified against
  // the server this session. A stale localStorage token shouldn't let us hit
  // the cloud API — the request would fail anyway.
  const accessToken = useSettingsStore((s) => s.collabAuth.accessToken)
  const authVerified = useSettingsStore((s) => s.authVerified)
  const signedIn = Boolean(accessToken && authVerified)
  const [source, setSource] = useState<OpenSource>(
    WEB_ONLY_CLOUD ? 'cloud' : 'local',
  )
  const [groups, setGroups] = useState<ProjectWithScripts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('updated_desc')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setGroups([])

    if (source === 'cloud' && !signedIn) {
      setLoading(false)
      // On the web, cloud is the only storage source. If the user isn't
      // signed in, pop the login dialog immediately instead of showing a
      // "please sign in" empty state — there's nowhere else they could go.
      // On the app (Tauri), the empty state is useful because the user can
      // switch to the "This device" tab.
      if (WEB_ONLY_CLOUD) {
        try {
          window.dispatchEvent(new CustomEvent('opendraft:auth-required'))
        } catch {
          /* no-op */
        }
      }
      return () => {
        cancelled = true
      }
    }

    ;(async () => {
      try {
        const client = source === 'cloud' ? cloudApi : api
        const projects = await client.listProjects()
        const all = await Promise.all(
          projects.map(async (project) => {
            try {
              const scripts = await client.listScripts(project.id)
              return { project, scripts }
            } catch {
              return { project, scripts: [] }
            }
          }),
        )
        if (!cancelled) {
          setGroups(all.filter((g) => g.scripts.length > 0))
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Could not load files')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [source, signedIn])

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = groups
      .map((g) => {
        const projectMatch = q && g.project.name.toLowerCase().includes(q)
        const scripts = g.scripts
          .filter(
            (s) => !q || projectMatch || s.title.toLowerCase().includes(q),
          )
          .slice()
          .sort((a, b) => compareScripts(a, b, sort))
        return { project: g.project, scripts }
      })
      .filter((g) => g.scripts.length > 0)
    return filtered
  }, [groups, query, sort])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="top-0 right-0 left-0 z-[3000] fixed max-[480px]:pt-[env(safe-area-inset-top,0px)] flex justify-center items-start bg-black/50 px-4 max-[480px]:px-0 pt-[5vh] pb-4 max-[480px]:pb-0 h-[var(--vv-height,100dvh)] overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[460px] max-w-[560px] max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col max-[768px]:min-w-0 max-[768px]:max-w-none max-[768px]:w-[calc(100vw-32px-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] max-[480px]:w-screen! max-[480px]:max-w-screen! max-[480px]:rounded-t-none max-[480px]:rounded-b-xl max-[480px]:max-h-[60vh] max-[480px]:overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="dialog-header px-5 py-3.5 border-b border-(--fd-border) font-semibold text-base shrink-0">
          Open
        </div>

        <div className="px-4 pt-2 pb-1 border-b border-(--fd-border)">
          {!WEB_ONLY_CLOUD && (
            <div className="flex gap-1 mb-2.5" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={source === 'local'}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border rounded-md text-[13px] font-medium cursor-pointer ${source === 'local' ? 'bg-(--fd-accent) text-white border-(--fd-accent)' : 'bg-transparent border-(--fd-border) text-(--fd-text-muted) hover:text-(--fd-text)'}`}
                onClick={() => setSource('local')}
              >
                <FaDesktop /> This device
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={source === 'cloud'}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border rounded-md text-[13px] font-medium cursor-pointer ${source === 'cloud' ? 'bg-(--fd-accent) text-white border-(--fd-accent)' : 'bg-transparent border-(--fd-border) text-(--fd-text-muted) hover:text-(--fd-text)'}`}
                onClick={() => setSource('cloud')}
              >
                <FaCloud /> OpenDraft Cloud
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <FaSearch
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--fd-text-muted) text-xs"
                aria-hidden="true"
              />
              <input
                className="w-full py-[7px] pr-2.5 pl-7 bg-(--fd-input-bg) border border-(--fd-border) rounded text-(--fd-text) text-[13px] outline-none focus:border-(--fd-accent)"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects and scripts…"
                autoFocus
              />
            </div>
            <select
              className="py-[7px] px-2 bg-(--fd-input-bg) border border-(--fd-border) rounded text-(--fd-text) text-xs cursor-pointer"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort"
            >
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="px-4 pt-2 pb-4 overflow-auto"
          style={{ maxHeight: 440 }}
        >
          {source === 'cloud' && !signedIn ? (
            <div className="text-(--fd-text-muted) px-4 py-5 text-center leading-[1.5] text-[13px]">
              Sign in to access your OpenDraft Cloud files. Click the indicator
              in the menu bar to sign in.
            </div>
          ) : loading ? (
            <div className="text-(--fd-text-muted) px-4 py-5 text-center leading-[1.5] text-[13px]">
              Loading…
            </div>
          ) : error ? (
            <div className="px-4 py-5 text-[#d77] text-[13px] text-center leading-[1.5]">
              {error}
            </div>
          ) : visibleGroups.length === 0 ? (
            <div className="text-(--fd-text-muted) px-4 py-5 text-center leading-[1.5] text-[13px]">
              {query
                ? `No files match “${query}”.`
                : source === 'cloud'
                  ? 'No cloud files yet. Use File › Save As… and pick OpenDraft Cloud to upload.'
                  : 'No files yet. Use File › Import to create a project.'}
            </div>
          ) : (
            visibleGroups.map((g) => (
              <div key={g.project.id} className="mb-3">
                <div className="text-[11px] uppercase tracking-[0.5px] text-(--fd-text-muted) pt-1.5 px-1 pb-1 font-semibold border-b border-(--fd-border) mb-0.5">
                  {g.project.name}
                </div>
                {g.scripts.map((s) => (
                  <div
                    key={s.id}
                    className="group flex justify-between items-center px-3 py-2 cursor-pointer rounded text-(--fd-text) mb-px hover:bg-(--fd-accent) hover:text-white"
                    onClick={() =>
                      onOpen(g.project.id, g.project, s.id, s.title, source)
                    }
                  >
                    <span className="text-[13px]">{s.title}</span>
                    <span className="text-[11px] text-(--fd-text-muted) group-hover:text-white/60">
                      {new Date(s.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="dialog-actions flex justify-end gap-2 px-5 py-3.5 border-t border-(--fd-border) shrink-0">
          <button
            className="h-[34px] px-[18px] bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-menu-hover) max-[768px]:h-10"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default OpenFile
