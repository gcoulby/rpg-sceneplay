/**
 * Template Editor Dialog — full-featured editor for formatting templates.
 *
 * Allows customizing every aspect of each element type:
 * text style, layout, transitions, placeholder, colors, etc.
 * Also supports adding/removing custom element types.
 */

import React, { useState, useCallback } from 'react'
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaPlus,
  FaTrash,
} from 'react-icons/fa'
import type {
  FormattingTemplate,
  FormattingElementRule,
} from '@/stores/formattingTypes'
import { createDefaultRule } from '@/stores/formattingTypes'
import { FONT_CATEGORIES, getFontsByCategory } from '@/utils/fonts'
import type { FontEntry } from '@/utils/fonts'

const FONT_SIZES = [
  8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96,
]

interface TemplateEditorDialogProps {
  template: FormattingTemplate
  onSave: (template: FormattingTemplate) => void
  onCancel: () => void
}

function uuid(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10)
}

const TemplateEditorDialog: React.FC<TemplateEditorDialogProps> = ({
  template: initial,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [mode, setMode] = useState<'enforce' | 'override'>(initial.mode)
  const [rules, setRules] = useState<Record<string, FormattingElementRule>>(
    JSON.parse(JSON.stringify(initial.rules)),
  )
  const [selectedId, setSelectedId] = useState<string | null>(
    Object.keys(rules)[0] || null,
  )

  const selectedRule = selectedId ? rules[selectedId] : null

  const updateRule = useCallback(
    (id: string, updates: Partial<FormattingElementRule>) => {
      setRules((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...updates },
      }))
    },
    [],
  )

  const addCustomElement = useCallback(() => {
    const id = uuid()
    const newRule = createDefaultRule(id, 'Custom Element', false)
    setRules((prev) => ({ ...prev, [id]: newRule }))
    setSelectedId(id)
  }, [])

  const removeElement = useCallback(
    (id: string) => {
      setRules((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      if (selectedId === id) {
        setSelectedId(Object.keys(rules).find((k) => k !== id) || null)
      }
    },
    [selectedId, rules],
  )

  const handleSave = () => {
    onSave({
      ...initial,
      name,
      description,
      mode,
      rules,
      updatedAt: new Date().toISOString(),
    })
  }

  // Build element options for dropdowns (for nextOnEnter/nextOnTab)
  const elementOptions = Object.values(rules)
    .filter((r) => r.enabled)
    .map((r) => ({ id: r.id, label: r.label }))

  return (
    <div
      className="z-2000 fixed inset-0 flex justify-center items-center bg-black/60"
      onClick={onCancel}
    >
      <div
        className="bg-(--fd-bg) border border-(--fd-border) rounded-lg w-225 max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between py-3 px-4 border-b border-(--fd-border)">
          <h2 className="m-0 text-base text-(--fd-text)">Edit Template</h2>
          <div className="flex gap-2">
            <button
              className="dialog-btn h-8.5 px-4.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-toolbar-hover)"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="dialog-btn dialog-btn-primary h-8.5 px-4.5 bg-(--fd-accent) border border-(--fd-accent) rounded cursor-pointer text-sm text-white hover:opacity-90"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>

        {/* Template meta */}
        <div className="py-3 px-4 border-b border-(--fd-border) flex gap-3 flex-wrap">
          <div className="flex flex-col flex-1 gap-1 min-w-45">
            <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
              Name
            </label>
            <input
              className="dialog-input h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border focus:border-(--fd-accent)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
            />
          </div>
          <div className="flex flex-col flex-1 gap-1 min-w-45">
            <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
              Description
            </label>
            <input
              className="dialog-input h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border focus:border-(--fd-accent)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="flex flex-col flex-1 gap-1 min-w-45">
            <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
              Mode
            </label>
            <div className="flex">
              <button
                className={`py-1.5 px-4 text-[13px] bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) cursor-pointer rounded-l first:rounded-l last:rounded-r last:border-l-0${mode === 'enforce' ? ' bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
                onClick={() => setMode('enforce')}
              >
                Enforce
              </button>
              <button
                className={`py-1.5 px-4 text-[13px] bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) cursor-pointer rounded-r border-l-0${mode === 'override' ? ' bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
                onClick={() => setMode('override')}
              >
                Override
              </button>
            </div>
            <span className="mt-0.5 text-[#aaa] text-[11px]">
              {mode === 'enforce'
                ? 'Formatting is locked — users cannot change element-level styling.'
                : 'Formatting sets defaults — users can override per-instance.'}
            </span>
          </div>
        </div>

        {/* Main body: element list + detail */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: element list */}
          <div className="w-60 min-w-50 border-r border-(--fd-border) flex flex-col">
            <div className="flex justify-between items-center px-3 py-2 font-bold text-[#aaa] text-xs uppercase tracking-[0.5px]">
              <span>Elements</span>
              <button
                className="bg-transparent border border-(--fd-border) text-(--fd-text) w-6 h-6 rounded cursor-pointer flex items-center justify-center text-[11px] hover:bg-(--fd-toolbar-hover)"
                onClick={addCustomElement}
                title="Add custom element"
              >
                <FaPlus />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {Object.values(rules).map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-center gap-2 py-1.5 px-3 cursor-pointer text-[13px] text-(--fd-text) border-l-[3px] border-l-transparent hover:bg-(--fd-toolbar-hover)${selectedId === rule.id ? ' bg-(--fd-toolbar-hover) border-l-(--fd-accent)' : ''}${!rule.enabled ? ' opacity-50' : ''}`}
                  onClick={() => setSelectedId(rule.id)}
                >
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) =>
                      updateRule(rule.id, { enabled: e.target.checked })
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="flex-1">
                    {rule.label}
                    {!rule.isBuiltIn && (
                      <span className="text-[9px] py-0.5 px-1 bg-(--fd-accent) text-white rounded-[3px] ml-1">
                        custom
                      </span>
                    )}
                  </span>
                  {!rule.isBuiltIn && (
                    <button
                      className="bg-transparent p-0.5 border-none text-[#aaa] text-[11px] hover:text-[#ff4444] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeElement(rule.id)
                      }}
                      title="Remove element"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: element detail */}
          <div className="flex flex-col flex-1 gap-3 p-4 overflow-y-auto">
            {selectedRule ? (
              <>
                {/* Label */}
                <div className="flex flex-col flex-1 gap-1 min-w-45">
                  <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                    Label
                  </label>
                  <input
                    className="dialog-input h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border focus:border-(--fd-accent)"
                    value={selectedRule.label}
                    onChange={(e) =>
                      updateRule(selectedId!, { label: e.target.value })
                    }
                    disabled={selectedRule.isBuiltIn}
                    placeholder="Element name"
                  />
                </div>

                {/* Font family & size */}
                <div className="flex gap-3">
                  <div className="flex flex-col flex-1 gap-1 min-w-45">
                    <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                      Font Family
                    </label>
                    <select
                      className="dialog-input h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border focus:border-(--fd-accent)"
                      value={selectedRule.fontFamily || ''}
                      onChange={(e) =>
                        updateRule(selectedId!, {
                          fontFamily: e.target.value || null,
                        })
                      }
                    >
                      <option value="">Default</option>
                      {FONT_CATEGORIES.map((category) => {
                        const fonts = getFontsByCategory()[category]
                        if (!fonts || fonts.length === 0) return null
                        return (
                          <optgroup key={category} label={category}>
                            {fonts.map((font: FontEntry) => (
                              <option key={font.name} value={font.name}>
                                {font.name}
                              </option>
                            ))}
                          </optgroup>
                        )
                      })}
                    </select>
                  </div>
                  <div className="flex flex-col flex-1 gap-1 min-w-45">
                    <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                      Font Size
                    </label>
                    <select
                      className="dialog-input h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border focus:border-(--fd-accent)"
                      value={selectedRule.fontSize ?? ''}
                      onChange={(e) =>
                        updateRule(selectedId!, {
                          fontSize: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    >
                      <option value="">Default</option>
                      {FONT_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}pt
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Text style toggles */}
                <div className="flex flex-col flex-1 gap-1 min-w-45">
                  <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                    Text Style
                  </label>
                  <div className="flex gap-1">
                    <button
                      className={`w-8 h-8 flex items-center justify-center bg-(--fd-toolbar-bg) border border-(--fd-border) text-(--fd-text) rounded cursor-pointer text-[13px] hover:bg-(--fd-toolbar-hover)${selectedRule.bold ? ' bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
                      onClick={() =>
                        updateRule(selectedId!, { bold: !selectedRule.bold })
                      }
                      title="Bold"
                    >
                      <FaBold />
                    </button>
                    <button
                      className={`w-8 h-8 flex items-center justify-center bg-(--fd-toolbar-bg) border border-(--fd-border) text-(--fd-text) rounded cursor-pointer text-[13px] hover:bg-(--fd-toolbar-hover)${selectedRule.italic ? ' bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
                      onClick={() =>
                        updateRule(selectedId!, {
                          italic: !selectedRule.italic,
                        })
                      }
                      title="Italic"
                    >
                      <FaItalic />
                    </button>
                    <button
                      className={`w-8 h-8 flex items-center justify-center bg-(--fd-toolbar-bg) border border-(--fd-border) text-(--fd-text) rounded cursor-pointer text-[13px] hover:bg-(--fd-toolbar-hover)${selectedRule.underline ? ' bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
                      onClick={() =>
                        updateRule(selectedId!, {
                          underline: !selectedRule.underline,
                        })
                      }
                      title="Underline"
                    >
                      <FaUnderline />
                    </button>
                    <button
                      className={`w-8 h-8 flex items-center justify-center bg-(--fd-toolbar-bg) border border-(--fd-border) text-(--fd-text) rounded cursor-pointer text-[13px] hover:bg-(--fd-toolbar-hover)${selectedRule.strikethrough ? ' bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
                      onClick={() =>
                        updateRule(selectedId!, {
                          strikethrough: !selectedRule.strikethrough,
                        })
                      }
                      title="Strikethrough"
                    >
                      <FaStrikethrough />
                    </button>
                  </div>
                </div>

                {/* Text transform */}
                <div className="flex flex-col flex-1 gap-1 min-w-45">
                  <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                    Text Transform
                  </label>
                  <select
                    className="dialog-input h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border focus:border-(--fd-accent)"
                    value={selectedRule.textTransform}
                    onChange={(e) =>
                      updateRule(selectedId!, {
                        textTransform: e.target.value as any,
                      })
                    }
                  >
                    <option value="none">None</option>
                    <option value="uppercase">Uppercase</option>
                    <option value="lowercase">Lowercase</option>
                  </select>
                </div>

                {/* Alignment */}
                <div className="flex flex-col flex-1 gap-1 min-w-45">
                  <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                    Alignment
                  </label>
                  <div className="flex gap-1">
                    <button
                      className={`w-8 h-8 flex items-center justify-center bg-(--fd-toolbar-bg) border border-(--fd-border) text-(--fd-text) rounded cursor-pointer text-[13px] hover:bg-(--fd-toolbar-hover)${selectedRule.textAlign === 'left' ? ' bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
                      onClick={() =>
                        updateRule(selectedId!, { textAlign: 'left' })
                      }
                    >
                      <FaAlignLeft />
                    </button>
                    <button
                      className={`w-8 h-8 flex items-center justify-center bg-(--fd-toolbar-bg) border border-(--fd-border) text-(--fd-text) rounded cursor-pointer text-[13px] hover:bg-(--fd-toolbar-hover)${selectedRule.textAlign === 'center' ? ' bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
                      onClick={() =>
                        updateRule(selectedId!, { textAlign: 'center' })
                      }
                    >
                      <FaAlignCenter />
                    </button>
                    <button
                      className={`w-8 h-8 flex items-center justify-center bg-(--fd-toolbar-bg) border border-(--fd-border) text-(--fd-text) rounded cursor-pointer text-[13px] hover:bg-(--fd-toolbar-hover)${selectedRule.textAlign === 'right' ? ' bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
                      onClick={() =>
                        updateRule(selectedId!, { textAlign: 'right' })
                      }
                    >
                      <FaAlignRight />
                    </button>
                    <button
                      className={`w-8 h-8 flex items-center justify-center bg-(--fd-toolbar-bg) border border-(--fd-border) text-(--fd-text) rounded cursor-pointer text-[13px] hover:bg-(--fd-toolbar-hover)${selectedRule.textAlign === 'justify' ? ' bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
                      onClick={() =>
                        updateRule(selectedId!, { textAlign: 'justify' })
                      }
                    >
                      <FaAlignJustify />
                    </button>
                  </div>
                </div>

                {/* Colors */}
                <div className="flex gap-3">
                  <div className="flex flex-col flex-1 gap-1 min-w-45">
                    <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                      Text Color
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        className="w-7 h-7 border border-(--fd-border) rounded bg-transparent cursor-pointer p-0"
                        value={selectedRule.textColor || '#000000'}
                        onChange={(e) =>
                          updateRule(selectedId!, { textColor: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        className="dialog-input flex-1 h-7 text-xs bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 outline-none box-border focus:border-(--fd-accent)"
                        value={selectedRule.textColor || ''}
                        onChange={(e) =>
                          updateRule(selectedId!, {
                            textColor: e.target.value || null,
                          })
                        }
                        placeholder="inherit"
                      />
                      {selectedRule.textColor && (
                        <button
                          className="bg-transparent border-none w-5 h-5 text-[#aaa] hover:text-[#ff4444] text-xs cursor-pointer"
                          onClick={() =>
                            updateRule(selectedId!, { textColor: null })
                          }
                        >
                          x
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 gap-1 min-w-45">
                    <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                      Background Color
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        className="w-7 h-7 border border-(--fd-border) rounded bg-transparent cursor-pointer p-0"
                        value={selectedRule.backgroundColor || '#ffffff'}
                        onChange={(e) =>
                          updateRule(selectedId!, {
                            backgroundColor: e.target.value,
                          })
                        }
                      />
                      <input
                        type="text"
                        className="dialog-input flex-1 h-7 text-xs bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 outline-none box-border focus:border-(--fd-accent)"
                        value={selectedRule.backgroundColor || ''}
                        onChange={(e) =>
                          updateRule(selectedId!, {
                            backgroundColor: e.target.value || null,
                          })
                        }
                        placeholder="transparent"
                      />
                      {selectedRule.backgroundColor && (
                        <button
                          className="bg-transparent border-none w-5 h-5 text-[#aaa] hover:text-[#ff4444] text-xs cursor-pointer"
                          onClick={() =>
                            updateRule(selectedId!, { backgroundColor: null })
                          }
                        >
                          x
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Layout: margin, indents */}
                <div className="flex gap-3">
                  <div className="flex flex-col flex-1 gap-1 min-w-45">
                    <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                      Margin Top (pt)
                    </label>
                    <input
                      type="number"
                      className="dialog-input w-20! h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none box-border focus:border-(--fd-accent)"
                      value={selectedRule.marginTop}
                      onChange={(e) =>
                        updateRule(selectedId!, {
                          marginTop: Number(e.target.value) || 0,
                        })
                      }
                      min={0}
                      step={1}
                    />
                  </div>
                  <div className="flex flex-col flex-1 gap-1 min-w-45">
                    <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                      Left Indent (in)
                    </label>
                    <input
                      type="number"
                      className="dialog-input w-20! h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none box-border focus:border-(--fd-accent)"
                      value={selectedRule.leftIndent}
                      onChange={(e) =>
                        updateRule(selectedId!, {
                          leftIndent: Number(e.target.value) || 0,
                        })
                      }
                      min={0}
                      step={0.25}
                    />
                  </div>
                  <div className="flex flex-col flex-1 gap-1 min-w-45">
                    <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                      Right Indent (in)
                    </label>
                    <input
                      type="number"
                      className="dialog-input w-20! h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none box-border focus:border-(--fd-accent)"
                      value={selectedRule.rightIndent}
                      onChange={(e) =>
                        updateRule(selectedId!, {
                          rightIndent: Number(e.target.value) || 0,
                        })
                      }
                      min={0}
                      step={0.25}
                    />
                  </div>
                </div>

                {/* Element flow */}
                <div className="flex gap-3">
                  <div className="flex flex-col flex-1 gap-1 min-w-45">
                    <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                      Next on Enter
                    </label>
                    <select
                      className="dialog-input h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border focus:border-(--fd-accent)"
                      value={selectedRule.nextOnEnter}
                      onChange={(e) =>
                        updateRule(selectedId!, { nextOnEnter: e.target.value })
                      }
                    >
                      {elementOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col flex-1 gap-1 min-w-45">
                    <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                      Next on Tab
                    </label>
                    <select
                      className="dialog-input h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border focus:border-(--fd-accent)"
                      value={selectedRule.nextOnTab || ''}
                      onChange={(e) =>
                        updateRule(selectedId!, {
                          nextOnTab: e.target.value || null,
                        })
                      }
                    >
                      <option value="">None</option>
                      {elementOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Placeholder */}
                <div className="flex flex-col flex-1 gap-1 min-w-45">
                  <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                    Placeholder Text
                  </label>
                  <input
                    className="dialog-input h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border focus:border-(--fd-accent)"
                    value={selectedRule.placeholder}
                    onChange={(e) =>
                      updateRule(selectedId!, { placeholder: e.target.value })
                    }
                    placeholder="Shown when element is empty"
                  />
                </div>

                {/* Format override */}
                {mode === 'enforce' && (
                  <div className="flex flex-col flex-1 gap-1 min-w-45">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRule.allowFormatOverride !== false}
                        onChange={(e) =>
                          updateRule(selectedId!, {
                            allowFormatOverride: e.target.checked,
                          })
                        }
                      />
                      Allow format override
                    </label>
                    <span className="mt-0.5 text-[#aaa] text-[11px]">
                      {selectedRule.allowFormatOverride !== false
                        ? 'Users can override formatting for this element type.'
                        : 'All formatting is locked — users cannot change any styling for this element.'}
                    </span>
                  </div>
                )}

                {/* Preview */}
                <div className="flex flex-col flex-1 gap-1 min-w-45">
                  <label className="text-[#aaa] text-[11px] uppercase tracking-[0.5px]">
                    Preview
                  </label>
                  <div
                    className="border border-(--fd-border) rounded px-4 py-3 min-h-12 text-(--fd-text) bg-(--fd-page-bg)"
                    style={{
                      fontFamily: selectedRule.fontFamily || undefined,
                      fontSize: selectedRule.fontSize
                        ? `${selectedRule.fontSize}pt`
                        : undefined,
                      fontWeight: selectedRule.bold ? 'bold' : 'normal',
                      fontStyle: selectedRule.italic ? 'italic' : 'normal',
                      textDecoration:
                        [
                          selectedRule.underline ? 'underline' : '',
                          selectedRule.strikethrough ? 'line-through' : '',
                        ]
                          .filter(Boolean)
                          .join(' ') || 'none',
                      textTransform: selectedRule.textTransform as any,
                      textAlign: selectedRule.textAlign as any,
                      marginTop: `${selectedRule.marginTop}pt`,
                      paddingLeft: `${Math.max(0, (selectedRule.leftIndent - 1.5) * 96)}px`,
                      color: selectedRule.textColor || undefined,
                      backgroundColor:
                        selectedRule.backgroundColor || undefined,
                    }}
                  >
                    {selectedRule.placeholder ||
                      selectedRule.label ||
                      'Sample text...'}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-full text-[#aaa] text-sm">
                Select an element from the list to edit its formatting.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateEditorDialog
