import React, { useMemo } from 'react';
import { useEditorStore, ELEMENT_LABELS, type BuiltInElementType } from '../stores/editorStore';
import { useProjectStore } from '../stores/projectStore';
import { useFormattingTemplateStore } from '../stores/formattingTemplateStore';
import { computeSceneTiming, formatRuntime } from '../utils/scriptTiming';
import { computeScriptStructure } from '../utils/scriptStructure';

const SAVE_STATUS_DISPLAY: Record<string, { label: string; className: string }> = {
  idle: { label: '', className: '' },
  unsaved: { label: 'Unsaved changes', className: 'text-[#f0ad4e]' },
  saving: { label: 'Saving\u2026', className: 'text-(--fd-accent)' },
  saved: { label: 'Saved', className: 'text-[#4ade80]' },
  error: { label: 'Save failed', className: 'text-[#ef4444] font-medium' },
};

interface StatusBarProps {
  editorDoc?: Record<string, unknown> | null;
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
  } = useEditorStore();

  const { currentProject } = useProjectStore();
  const getActiveTemplate = useFormattingTemplateStore((s) => s.getActiveTemplate);

  const saveDisplay = SAVE_STATUS_DISPLAY[saveStatus] || SAVE_STATUS_DISPLAY.idle;

  const elementLabel = useMemo(() => {
    const builtIn = (ELEMENT_LABELS as Record<string, string>)[activeElement as BuiltInElementType];
    if (builtIn) return builtIn;
    try {
      const rule = getActiveTemplate().rules[activeElement];
      return rule?.label || activeElement;
    } catch {
      return activeElement;
    }
  }, [activeElement, getActiveTemplate]);

  const estimatedRuntime = useMemo(() => {
    if (!editorDoc) return '';
    try {
      const result = computeSceneTiming(editorDoc as any);
      return result.totalSeconds > 0 ? formatRuntime(result.totalSeconds) : '';
    } catch {
      return '';
    }
  }, [editorDoc]);

  const currentAct = useMemo(() => {
    if (!editorDoc) return '';
    try {
      const structure = computeScriptStructure(editorDoc as any);
      const realActs = structure.acts.filter((a) => a.actNumber > 0);
      if (realActs.length === 0) return '';
      return `${realActs.length} act${realActs.length === 1 ? '' : 's'}`;
    } catch {
      return '';
    }
  }, [editorDoc]);

  return (
    <div className="status-bar flex items-center justify-between h-6 flex-1 shrink-0 select-none bg-(--fd-status-bg) border-t border-(--fd-border) px-3">
      <div className="flex items-center gap-4 flex-1">
        {currentProject && (
          <span className="text-[11px] whitespace-nowrap text-(--fd-text) font-medium">{currentProject.name}</span>
        )}
        {currentProject && <span className="text-(--fd-text-muted) text-[10px] -mx-1.5 opacity-50">/</span>}
        <span className="text-[11px] text-(--fd-text-muted) whitespace-nowrap">{documentTitle}</span>
        {saveDisplay.label && (
          <>
            <span className="text-(--fd-text-muted) text-[10px] -mx-1.5 opacity-50">&middot;</span>
            <span className={`text-[11px] whitespace-nowrap ${saveDisplay.className}`}>{saveDisplay.label}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4 flex-none">
        <span className="text-[11px] whitespace-nowrap text-(--fd-accent) font-medium">
          {elementLabel}
        </span>
      </div>
      <div className="flex items-center gap-4 flex-1 justify-end">
        {currentAct && (
          <span className="text-[11px] text-(--fd-text-muted) whitespace-nowrap" title="Act structure">
            {currentAct}
          </span>
        )}
        {estimatedRuntime && (
          <span className="text-[11px] text-(--fd-text-muted) whitespace-nowrap tabular-nums" title="Estimated runtime">
            Est. {estimatedRuntime}
          </span>
        )}
        {revisionMode && (
          <span className="text-[11px] whitespace-nowrap text-[#f0ad4e]">
            Rev: {revisionColor}
          </span>
        )}
        <span className="text-[11px] text-(--fd-text-muted) whitespace-nowrap tabular-nums">
          Page {currentPage} of {pageCount}
        </span>
      </div>
    </div>
  );
};

export default StatusBar;
