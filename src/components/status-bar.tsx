import React, { useMemo } from 'react'
import {
  useEditorStore,
  ELEMENT_LABELS,
  type BuiltInElementType,
} from '@/stores/editorStore'
import { useFormattingTemplateStore } from '@/stores/formattingTemplateStore'
import {
  computeSceneTiming,
  formatRuntime,
} from '@/utils/open-draft/scriptTiming'
import { computeScriptStructure } from '@/utils/open-draft/scriptStructure'
import type { JSONContent } from '@tiptap/core'

const SAVE_STATUS_DISPLAY: Record<
  string,
  { label: string; className: string }
> = {
  idle: { label: '', className: '' },
  unsaved: { label: 'Unsaved changes', className: 'text-[#f0ad4e]' },
  saving: { label: 'Saving\u2026', className: 'text-(--fd-accent)' },
  saved: { label: 'Saved', className: 'text-[#4ade80]' },
  error: { label: 'Save failed', className: 'text-[#ef4444] font-medium' },
}

interface StatusBarProps {
  editorDoc?: Record<string, unknown> | null
}

const StatusBar: React.FC<StatusBarProps> = ({ editorDoc = null }) => {
  const {
    activeElement,
    pageCount,
    currentPage,
    revisionMode,
    revisionColor,
    documentTitle,
    saveStatus,
  } = useEditorStore()

  const getActiveTemplate = useFormattingTemplateStore(
    (s) => s.getActiveTemplate,
  )

  const saveDisplay =
    SAVE_STATUS_DISPLAY[saveStatus] || SAVE_STATUS_DISPLAY.idle

  const elementLabel = useMemo(() => {
    const builtIn = (ELEMENT_LABELS as Record<string, string>)[
      activeElement as BuiltInElementType
    ]
    if (builtIn) return builtIn
    try {
      const rule = getActiveTemplate().rules[activeElement]
      return rule?.label || activeElement
    } catch {
      return activeElement
    }
  }, [activeElement, getActiveTemplate])

  const estimatedRuntime = useMemo(() => {
    if (!editorDoc) return ''
    try {
      const result = computeSceneTiming(editorDoc as JSONContent)
      return result.totalSeconds > 0 ? formatRuntime(result.totalSeconds) : ''
    } catch {
      return ''
    }
  }, [editorDoc])

  const currentAct = useMemo(() => {
    if (!editorDoc) return ''
    try {
      const structure = computeScriptStructure(editorDoc as JSONContent)
      const realActs = structure.acts.filter((a) => a.actNumber > 0)
      if (realActs.length === 0) return ''
      return `${realActs.length} act${realActs.length === 1 ? '' : 's'}`
    } catch {
      return ''
    }
  }, [editorDoc])

  return (
    <div className="status-bar flex items-center justify-between h-6 flex-1 shrink-0 select-none  border-t border-(--fd-border) px-3">
      <div className="flex flex-1 items-center gap-4">
        <span className="text-[11px] text-(--fd-text-muted) whitespace-nowrap">
          {documentTitle}
        </span>
        {saveDisplay.label && (
          <>
            <span className="text-(--fd-text-muted) text-[10px] -mx-1.5 opacity-50">
              &middot;
            </span>
            <span
              className={`text-[11px] whitespace-nowrap ${saveDisplay.className}`}
            >
              {saveDisplay.label}
            </span>
          </>
        )}
      </div>
      <div className="flex flex-none items-center gap-4">
        <span className="text-[11px] whitespace-nowrap text-(--fd-accent) font-medium">
          {elementLabel}
        </span>
      </div>
      <div className="flex flex-1 justify-end items-center gap-4">
        {currentAct && (
          <span
            className="text-[11px] text-(--fd-text-muted) whitespace-nowrap"
            title="Act structure"
          >
            {currentAct}
          </span>
        )}
        {estimatedRuntime && (
          <span
            className="text-[11px] text-(--fd-text-muted) whitespace-nowrap tabular-nums"
            title="Estimated runtime"
          >
            Est. {estimatedRuntime}
          </span>
        )}
        {revisionMode && (
          <span className="text-[#f0ad4e] text-[11px] whitespace-nowrap">
            Rev: {revisionColor}
          </span>
        )}
        <span className="text-[11px] text-(--fd-text-muted) whitespace-nowrap tabular-nums">
          Page {currentPage} of {pageCount}
        </span>
      </div>
    </div>
  )
}

export default StatusBar
