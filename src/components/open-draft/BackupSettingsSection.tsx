/**
 * Settings → Automatic Backups.
 *
 * On web and mobile the section still renders, but as an explanation rather
 * than controls. Hiding it entirely would leave users hunting for a feature
 * they read about; saying why it isn't there — and what to use instead — costs
 * one paragraph and prevents a bug report.
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  useSettingsStore,
  BACKUP_INTERVAL_OPTIONS,
  BACKUP_RETENTION_OPTIONS,
} from '@/stores/settingsStore'
import { useBackupStatusStore } from '@/stores/backupStatusStore'
import { isDesktopTauri } from '@/services/platform'
import { isUnderOneDrive } from '@/services/diagnostics'
import {
  probeBackupFolder,
  listSnapshots,
  revealSnapshot,
} from '@/services/backupService'
import { showToast } from './Toast'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

const BackupSettingsSection: React.FC = () => {
  const {
    backupEnabled,
    setBackupEnabled,
    backupFolder,
    setBackupFolder,
    backupIntervalMinutes,
    setBackupIntervalMinutes,
    backupRetentionCount,
    setBackupRetentionCount,
    backupIncludeImages,
    setBackupIncludeImages,
    backupUnsavedDocs,
    setBackupUnsavedDocs,
  } = useSettingsStore()
  const resumeBackups = useBackupStatusStore((s) => s.resume)
  const pausedByError = useBackupStatusStore((s) => s.pausedByError)
  const lastError = useBackupStatusStore((s) => s.lastError)

  const desktop = isDesktopTauri()
  const [folderStatus, setFolderStatus] = useState<
    'unknown' | 'ok' | 'missing' | 'unwritable'
  >('unknown')
  const [folderDetail, setFolderDetail] = useState('')
  const [stats, setStats] = useState<{ count: number; bytes: number } | null>(
    null,
  )

  /** Probe the folder and, if usable, summarise what is already in it. */
  const refreshFolder = useCallback(
    async (path: string) => {
      if (!desktop || !path) {
        setFolderStatus('unknown')
        setStats(null)
        return
      }
      try {
        const probe = await probeBackupFolder(path)
        if (!probe.exists) {
          setFolderStatus('missing')
          setFolderDetail(probe.error || 'Folder not found')
          setStats(null)
          return
        }
        if (!probe.writable) {
          setFolderStatus('unwritable')
          setFolderDetail(probe.error || 'Folder is not writable')
          setStats(null)
          return
        }
        setFolderStatus('ok')
        setFolderDetail('')
        const entries = await listSnapshots()
        setStats({
          count: entries.length,
          bytes: entries.reduce((n, e) => n + e.sizeBytes, 0),
        })
      } catch (err) {
        setFolderStatus('missing')
        setFolderDetail(err instanceof Error ? err.message : String(err))
        setStats(null)
      }
    },
    [desktop],
  )

  useEffect(() => {
    void refreshFolder(backupFolder)
  }, [backupFolder, refreshFolder])

  const applyFolder = useCallback(
    async (path: string) => {
      setBackupFolder(path)
      // Any settings change is treated as "the user has addressed it", so a
      // scheduler that gave up starts trying again.
      resumeBackups()
      await refreshFolder(path)
    },
    [setBackupFolder, resumeBackups, refreshFolder],
  )

  const handleBrowse = useCallback(async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog')
      const picked = await open({
        directory: true,
        multiple: false,
        defaultPath: backupFolder || undefined,
      })
      if (typeof picked === 'string' && picked) await applyFolder(picked)
    } catch (err) {
      showToast(
        `Could not open the folder picker: ${err instanceof Error ? err.message : String(err)}`,
        'error',
      )
    }
  }, [backupFolder, applyFolder])

  const handleUseDefault = useCallback(async () => {
    try {
      const { documentDir, join } = await import('@tauri-apps/api/path')
      const dir = await join(await documentDir(), 'OpenDraft Backups')
      // Not created here — it appears when the first snapshot is written, so
      // enabling and then changing your mind leaves nothing behind.
      await applyFolder(dir)
    } catch (err) {
      showToast(
        `Could not resolve a default folder: ${err instanceof Error ? err.message : String(err)}`,
        'error',
      )
    }
  }, [applyFolder])

  const handleCreateFolder = useCallback(async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('ensure_dir', { path: backupFolder })
      await refreshFolder(backupFolder)
      showToast('Backup folder created', 'success')
    } catch (err) {
      showToast(
        `Could not create the folder: ${err instanceof Error ? err.message : String(err)}`,
        'error',
      )
    }
  }, [backupFolder, refreshFolder])

  const handleToggleEnabled = useCallback(
    async (next: boolean) => {
      if (next && !backupFolder) {
        // Enabling with nowhere to write would silently do nothing.
        await handleBrowse()
        if (!useSettingsStore.getState().backupFolder) return
      }
      if (next && folderStatus === 'unwritable') {
        showToast('Choose a folder OpenDraft can write to first', 'error')
        return
      }
      setBackupEnabled(next)
      resumeBackups()
    },
    [backupFolder, folderStatus, handleBrowse, setBackupEnabled, resumeBackups],
  )

  if (!desktop) {
    return (
      <section className="mb-10">
        <h2 className="text-lg font-bold m-0 mb-1.5 text-(--fd-text)">
          Automatic Backups
        </h2>
        <p className="text-sm text-(--fd-text-muted) m-0 mb-5 leading-normal">
          Timed backups write files to a folder on your computer, which the
          desktop app can do. In the browser and on phones and tablets, use{' '}
          <strong>File → Export → OpenDraft (.odraft)</strong> to save a copy
          wherever you like — on mobile that opens the system share sheet, so
          you can put it in Files, Drive, or Dropbox.
        </p>
      </section>
    )
  }

  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold m-0 mb-1.5 text-(--fd-text)">
        Automatic Backups
      </h2>
      <p className="text-sm text-(--fd-text-muted) m-0 mb-5 leading-normal">
        OpenDraft can save timestamped copies of your script to a folder you
        choose while you write. Each project gets its own folder inside it, and
        the first copy is written as soon as you turn this on. Backups live
        outside the app's database, so they survive even if something happens to
        it. This is separate from <strong>Version History</strong>, which stores
        checkpoints inside the database.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-(--fd-text)">
          <input
            type="checkbox"
            checked={backupEnabled}
            onChange={(e) => void handleToggleEnabled(e.target.checked)}
          />{' '}
          Back up my work automatically
        </label>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-(--fd-text)">
          Backup folder
        </label>
        <div className="flex gap-2">
          <input
            className="flex-1 h-9 text-sm bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded outline-none px-2.5 focus:border-(--fd-accent)"
            value={backupFolder}
            readOnly
            placeholder="No folder chosen"
          />
          <button
            className="dialog-btn dialog-btn-primary h-8.5 px-4.5 bg-(--fd-accent) border border-(--fd-accent) text-white rounded cursor-pointer text-sm hover:opacity-90"
            onClick={() => void handleBrowse()}
          >
            Browse…
          </button>
          <button
            className="dialog-btn h-8.5 px-4.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-toolbar-hover)"
            onClick={() => void handleUseDefault()}
          >
            Use Default
          </button>
          <button
            className="dialog-btn h-8.5 px-4.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-toolbar-hover) disabled:opacity-50 disabled:cursor-default"
            disabled={!backupFolder || folderStatus !== 'ok'}
            onClick={() =>
              void revealSnapshot(backupFolder).catch(() =>
                showToast('Could not open the folder', 'error'),
              )
            }
          >
            Open
          </button>
        </div>

        {folderStatus === 'ok' && stats && (
          <div className="mt-2 py-1 text-[#66bb6a] text-[13px]">
            Folder is writable — {stats.count} backup
            {stats.count === 1 ? '' : 's'}, {formatBytes(stats.bytes)}
          </div>
        )}
        {folderStatus === 'missing' && backupFolder && (
          <div className="mt-2 py-1 text-[#ef5350] text-[13px]">
            Folder not found — {folderDetail}{' '}
            <button
              className="dialog-btn h-8.5 px-4.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-toolbar-hover)"
              onClick={() => void handleCreateFolder()}
            >
              Create it
            </button>
          </div>
        )}
        {folderStatus === 'unwritable' && (
          <div className="mt-2 py-1 text-[#ef5350] text-[13px]">
            OpenDraft can't write here — {folderDetail}
          </div>
        )}
        {isUnderOneDrive(backupFolder) && (
          <div className="mt-2 text-[#e0a800] text-[13px] not-italic">
            This folder is inside OneDrive. Cloud sync can interfere with files
            as they're written — a local folder is safer for backups.
          </div>
        )}
        {pausedByError && (
          <div className="mt-2 py-1 text-[#ef5350] text-[13px]">
            Automatic backups are paused — {lastError}{' '}
            <button
              className="dialog-btn h-8.5 px-4.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-toolbar-hover)"
              onClick={() => {
                resumeBackups()
                void refreshFolder(backupFolder)
              }}
            >
              Resume
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-(--fd-text)">
          Back up every
        </label>
        <select
          className="h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border focus:border-(--fd-accent)"
          value={backupIntervalMinutes}
          onChange={(e) => setBackupIntervalMinutes(Number(e.target.value))}
        >
          {BACKUP_INTERVAL_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} minutes
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-(--fd-text)">
          Keep
        </label>
        <select
          className="h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border focus:border-(--fd-accent)"
          value={backupRetentionCount}
          onChange={(e) => setBackupRetentionCount(Number(e.target.value))}
        >
          {BACKUP_RETENTION_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n === 0 ? 'All backups' : `${n} most recent`}
            </option>
          ))}
        </select>
        <div className="text-[13px] text-(--fd-text-muted) mt-2 italic">
          Applies per script. Backups you make yourself with{' '}
          <strong>Back Up Now</strong> are never deleted automatically.
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-(--fd-text)">
          <input
            type="checkbox"
            checked={backupIncludeImages}
            onChange={(e) => setBackupIncludeImages(e.target.checked)}
          />{' '}
          Include images in backups
        </label>
        <div className="text-[13px] text-(--fd-text-muted) mt-2 italic">
          Makes backups larger, but a restored script comes back complete.
          Without this, images in a restored script will be missing.
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-(--fd-text)">
          <input
            type="checkbox"
            checked={backupUnsavedDocs}
            onChange={(e) => setBackupUnsavedDocs(e.target.checked)}
          />{' '}
          Also back up documents I haven't saved yet
        </label>
      </div>
    </section>
  )
}

export default BackupSettingsSection
