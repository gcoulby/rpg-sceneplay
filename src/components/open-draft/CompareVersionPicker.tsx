import React, { useEffect, useState, useCallback } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { api } from '@/services/api'
import type { VersionInfo } from '@/services/api'

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

interface CompareVersionPickerProps {
  onSelect: (version: VersionInfo) => void
  onClose: () => void
}

const CompareVersionPicker: React.FC<CompareVersionPickerProps> = ({
  onSelect,
  onClose,
}) => {
  const { currentProject } = useProjectStore()
  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadVersions = useCallback(async () => {
    if (!currentProject) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.getVersions(currentProject.id)
      setVersions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions')
    } finally {
      setLoading(false)
    }
  }, [currentProject])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  return (
    <div
      className="top-0 z-3000 fixed inset-x-0 max-[480px]:pt-[env(safe-area-inset-top,0px)] flex justify-center items-start bg-black/50 px-4 max-[480px]:px-0 pt-[5vh] pb-4 max-[480px]:pb-0 h-[var(--vv-height,100dvh)] overflow-y-auto dialog-overlay"
      onClick={onClose}
    >
      <div
        className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col w-105 max-h-[70vh] max-[768px]:w-[calc(100vw-32px-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] max-[480px]:w-screen! max-[480px]:max-w-screen! max-[480px]:rounded-t-none max-[480px]:rounded-b-xl max-[480px]:max-h-[60vh] max-[480px]:overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-3.5 px-5 border-b border-(--fd-border) font-semibold text-base shrink-0 text-(--fd-text)">
          Compare with Version
        </div>
        <div className="flex-auto p-5 overflow-y-auto">
          {!currentProject && (
            <p className="py-4 text-(--fd-text-muted) text-xs italic text-center">
              No project selected.
            </p>
          )}
          {error && (
            <p className="py-4 text-[#ff6b6b] text-xs text-center italic">
              {error}
            </p>
          )}
          {loading && (
            <p className="py-4 text-(--fd-text-muted) text-xs italic text-center">
              Loading versions...
            </p>
          )}

          {!loading && versions.length === 0 && currentProject && (
            <p className="py-4 text-(--fd-text-muted) text-xs italic text-center">
              No versions yet. Use File &gt; Check In to save a version.
            </p>
          )}

          <div className="mt-2 max-h-[50vh] overflow-y-auto">
            {versions.map((v) => (
              <div
                key={v.hash}
                className="py-2.5 px-3 border-b border-(--fd-overlay-subtle) cursor-pointer rounded transition-colors hover:bg-[rgba(74,158,255,0.12)]"
                onClick={() => onSelect(v)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[11px] text-(--fd-accent) font-semibold">
                    {v.short_hash}
                  </span>
                  <span className="text-[11px] text-(--fd-text-muted)">
                    {relativeTime(v.date)}
                  </span>
                </div>
                <div className="text-xs text-(--fd-text) leading-[1.4] mb-1.5">
                  {v.message}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 py-3.5 px-5 border-t border-(--fd-border) shrink-0 [&_button]:h-8.5 [&_button]:px-4.5 [&_button]:bg-(--fd-toolbar-bg) [&_button]:text-(--fd-text) [&_button]:border [&_button]:border-(--fd-border) [&_button]:rounded [&_button]:cursor-pointer [&_button]:text-sm [&_button]:hover:bg-(--fd-menu-hover) max-[768px]:[&_button]:h-10">
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default CompareVersionPicker
