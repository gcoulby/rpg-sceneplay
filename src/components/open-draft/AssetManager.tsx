import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAssetStore } from '@/stores/assetStore'
import type { Asset } from '@/stores/assetStore'
import AssetViewer from './AssetViewer'
import { api } from '@/services/api'
import { showToast } from './Toast'

interface AssetManagerProps {
  projectId: string
  embedded?: boolean
}

const AssetManager: React.FC<AssetManagerProps> = ({
  projectId,
  embedded = false,
}) => {
  const { assets, setAssets, assetManagerOpen, setAssetManagerOpen } =
    useAssetStore()
  const [filterText, setFilterText] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null)
  const [editTagsValue, setEditTagsValue] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingTagsId, setSavingTagsId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAssets = useCallback(async () => {
    try {
      const list = await api.listAssets(projectId)
      setAssets(list)
    } catch {
      // silently fail
    }
  }, [projectId, setAssets])

  useEffect(() => {
    if (embedded || assetManagerOpen) {
      fetchAssets()
    }
  }, [embedded, assetManagerOpen, fetchAssets])

  // Handle Tauri native drag-and-drop forwarded from ScreenplayEditor
  useEffect(() => {
    if (!embedded && !assetManagerOpen) return
    const handler = async (e: Event) => {
      const paths = (e as CustomEvent).detail?.paths as string[] | undefined
      if (!paths || paths.length === 0) return
      try {
        const { readFile } = await import('@tauri-apps/plugin-fs')
        setUploading(true)
        let failed = 0
        for (const filePath of paths) {
          const filename = filePath.replace(/^.*[\\/]/, '') || 'file'
          try {
            const data = await readFile(filePath)
            const ext = filename.split('.').pop()?.toLowerCase() || ''
            const mimeMap: Record<string, string> = {
              png: 'image/png',
              jpg: 'image/jpeg',
              jpeg: 'image/jpeg',
              gif: 'image/gif',
              webp: 'image/webp',
              svg: 'image/svg+xml',
              pdf: 'application/pdf',
              mp3: 'audio/mpeg',
              wav: 'audio/wav',
              mp4: 'video/mp4',
              webm: 'video/webm',
              txt: 'text/plain',
            }
            const mime = mimeMap[ext] || 'application/octet-stream'
            const file = new File([data], filename, { type: mime })
            const tags = tagInput.trim()
              ? tagInput
                  .trim()
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
              : []
            await api.uploadAsset(projectId, file, tags)
          } catch {
            failed++
            showToast(`Failed to upload "${filename}"`, 'error')
          }
        }
        setTagInput('')
        await fetchAssets()
        setUploading(false)
        const succeeded = paths.length - failed
        if (succeeded > 0) {
          showToast(
            `Uploaded ${succeeded} file${succeeded !== 1 ? 's' : ''} successfully`,
            'success',
          )
        }
      } catch {
        setUploading(false)
      }
    }
    window.addEventListener('tauri-asset-drop', handler)
    return () => window.removeEventListener('tauri-asset-drop', handler)
  }, [embedded, assetManagerOpen, projectId, tagInput, fetchAssets])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    let failed = 0
    const fileArray = Array.from(files)
    for (const file of fileArray) {
      const tags = tagInput.trim()
        ? tagInput
            .trim()
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : []
      try {
        await api.uploadAsset(projectId, file, tags)
      } catch (err) {
        failed++
        showToast(
          `Failed to upload "${file.name}": ${err instanceof Error ? err.message : 'unknown error'}`,
          'error',
        )
      }
    }
    setTagInput('')
    await fetchAssets()
    setUploading(false)
    const succeeded = fileArray.length - failed
    if (succeeded > 0) {
      showToast(
        `Uploaded ${succeeded} file${succeeded !== 1 ? 's' : ''} successfully`,
        'success',
      )
    }
  }

  const handleDelete = async (assetId: string) => {
    setDeletingId(assetId)
    try {
      await api.deleteAsset(projectId, assetId)
      await fetchAssets()
      showToast('Asset deleted', 'success')
    } catch (err) {
      showToast(
        `Failed to delete asset: ${err instanceof Error ? err.message : 'unknown error'}`,
        'error',
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = (asset: Asset) => {
    const url = api.getAssetUrl(projectId, asset.id, asset.filename)
    const a = document.createElement('a')
    a.href = url
    a.download = asset.original_name
    a.click()
  }

  const handleSaveTags = async (assetId: string) => {
    const tags = editTagsValue
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    setSavingTagsId(assetId)
    try {
      await api.updateAssetTags(projectId, assetId, tags)
      await fetchAssets()
      showToast('Tags updated', 'success')
    } catch (err) {
      showToast(
        `Failed to update tags: ${err instanceof Error ? err.message : 'unknown error'}`,
        'error',
      )
    } finally {
      setSavingTagsId(null)
      setEditingTagsId(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }

  // Collect all unique tags
  const allTags = Array.from(new Set(assets.flatMap((a) => a.tags))).sort()

  // Filter assets
  const filtered = assets.filter((a) => {
    const nameMatch =
      !filterText ||
      a.original_name.toLowerCase().includes(filterText.toLowerCase())
    const tagMatch = !filterTag || a.tags.includes(filterTag)
    return nameMatch && tagMatch
  })

  const getMimeIcon = (mime: string): string => {
    if (mime.startsWith('image/')) return '\ud83d\uddbc'
    if (mime.startsWith('audio/')) return '\ud83c\udfb5'
    if (mime.startsWith('video/')) return '\ud83c\udfac'
    if (mime === 'application/pdf') return '\ud83d\udcc4'
    if (mime.startsWith('text/')) return '\ud83d\udcdd'
    return '\ud83d\udcc1'
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const content = (
    <div className="flex flex-col flex-1 gap-3 p-4 overflow-y-auto">
      {/* Upload section */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-150 ${dragOver ? 'border-(--fd-accent) bg-[rgba(74,158,255,0.05)]' : 'border-(--fd-border) hover:border-(--fd-accent) hover:bg-[rgba(74,158,255,0.05)]'}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleUpload(e.target.files)}
        />
        <div className="mb-2 text-2xl">{uploading ? '\u23f3' : '\u2b06'}</div>
        <div className="text-[13px] text-(--fd-text-muted)">
          {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-(--fd-text-muted)">
        <label>Tags for upload:</label>
        <input
          type="text"
          placeholder="tag1, tag2, ..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          className="flex-1 h-7 bg-[#222] text-(--fd-text) border border-[#555] rounded-[3px] px-2 text-xs outline-none focus:border-(--fd-accent)"
        />
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by name..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="flex-1 h-7 bg-[#222] text-(--fd-text) border border-[#555] rounded-[3px] px-2 text-xs outline-none focus:border-(--fd-accent)"
        />
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="h-7 bg-[#222] text-(--fd-text) border border-[#555] rounded-[3px] px-2 text-xs cursor-pointer outline-none min-w-30 focus:border-(--fd-accent)"
        >
          <option value="">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Asset list */}
      <div className="max-h-100 overflow-y-auto asset-list">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-(--fd-text-muted) text-[13px] italic">
            {assets.length === 0
              ? 'No assets yet. Upload files to get started.'
              : 'No assets match your filters.'}
          </div>
        ) : (
          <table className="w-full border-collapse text-xs [&_th]:text-left [&_th]:px-2.5 [&_th]:py-2 [&_th]:text-(--fd-text-muted) [&_th]:text-[10px] [&_th]:uppercase [&_th]:tracking-[0.5px] [&_th]:border-b [&_th]:border-(--fd-border) [&_th]:font-semibold">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Size</th>
                <th>Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <tr
                  key={asset.id}
                  className="hover:bg-[rgba(74,158,255,0.05)] border-[rgba(255,255,255,0.04)] border-b transition-colors duration-100"
                >
                  <td className="px-2.5 py-2 w-10 text-base">
                    <span title={asset.mime_type}>
                      {getMimeIcon(asset.mime_type)}
                    </span>
                  </td>
                  <td
                    className="px-2.5 py-2 text-(--fd-accent) cursor-pointer font-medium hover:underline"
                    onClick={() => setPreviewAsset(asset)}
                    title="Click to preview"
                  >
                    {asset.original_name}
                  </td>
                  <td className="px-2.5 py-2 text-(--fd-text-muted) whitespace-nowrap w-20">
                    {formatSize(asset.size_bytes)}
                  </td>
                  <td className="px-2.5 py-2 min-w-30">
                    {editingTagsId === asset.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editTagsValue}
                          onChange={(e) => setEditTagsValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTags(asset.id)
                            if (e.key === 'Escape' && !savingTagsId)
                              setEditingTagsId(null)
                          }}
                          className="flex-1 h-6 bg-[#222] text-(--fd-text) border border-(--fd-accent) rounded-[3px] px-1.5 text-[11px] outline-none disabled:opacity-50"
                          disabled={savingTagsId === asset.id}
                          autoFocus
                        />
                        <button
                          className="h-6 px-2 bg-(--fd-accent) text-white border-none rounded-[3px] text-[10px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleSaveTags(asset.id)}
                          disabled={savingTagsId === asset.id}
                        >
                          {savingTagsId === asset.id ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex flex-wrap gap-1 cursor-pointer"
                        onClick={() => {
                          setEditingTagsId(asset.id)
                          setEditTagsValue(asset.tags.join(', '))
                        }}
                        title="Click to edit tags"
                      >
                        {asset.tags.length > 0 ? (
                          asset.tags.map((t) => (
                            <span
                              key={t}
                              className="inline-block bg-[rgba(74,158,255,0.15)] text-(--fd-accent) px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium"
                            >
                              #{t}
                            </span>
                          ))
                        ) : (
                          <span className="text-(--fd-text-muted) text-[11px] italic">
                            no tags
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-2.5 py-2 w-20 whitespace-nowrap">
                    <button
                      className="bg-transparent border-none text-(--fd-text-muted) text-sm cursor-pointer px-1.5 py-0.5 rounded-[3px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:text-(--fd-accent) enabled:hover:bg-[rgba(74,158,255,0.1)]"
                      onClick={() => handleDownload(asset)}
                      title="Download"
                      disabled={deletingId === asset.id}
                    >
                      &#x2B07;
                    </button>
                    <button
                      className="bg-transparent border-none text-(--fd-text-muted) text-sm cursor-pointer px-1.5 py-0.5 rounded-[3px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:text-[#ff6b6b] enabled:hover:bg-[rgba(255,107,107,0.1)]"
                      onClick={() => handleDelete(asset.id)}
                      title="Delete"
                      disabled={deletingId === asset.id}
                    >
                      {deletingId === asset.id ? '\u23f3' : '\u2715'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview overlay */}
      {previewAsset && (
        <AssetViewer
          asset={previewAsset}
          projectId={projectId}
          onClose={() => setPreviewAsset(null)}
        />
      )}
    </div>
  )

  // If embedded (inside ProjectView), render without dialog overlay
  if (embedded) {
    return <div className="bg-transparent asset-manager">{content}</div>
  }

  // Otherwise render as dialog
  if (!assetManagerOpen) return null

  return (
    <div
      className="dialog-overlay fixed left-0 top-0 right-0 bg-[rgba(0,0,0,0.5)] z-3000 flex items-start justify-center h-(--vv-height,100dvh) pt-[5vh] px-4 pb-4 overflow-y-auto"
      onClick={() => setAssetManagerOpen(false)}
    >
      <div
        className="asset-manager dialog bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] w-180 max-w-[90vw] max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-(--fd-border) font-semibold text-sm shrink-0">
          <span>Asset Manager</span>
          <button
            className="asset-manager-close bg-transparent border-none text-(--fd-text-muted) text-xl cursor-pointer px-1 py-0 leading-none hover:text-(--fd-text)"
            onClick={() => setAssetManagerOpen(false)}
          >
            &times;
          </button>
        </div>
        {content}
      </div>
    </div>
  )
}

export default AssetManager
