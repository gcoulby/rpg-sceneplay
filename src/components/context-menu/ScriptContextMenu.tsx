import { useMemo } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'
import { useEditorStore } from '@/stores/editorStore'
import {
  handleCopy,
  handleCut,
  handlePaste,
  handleRedo,
  handleSelectAll,
  handleUndo,
} from '@/actions/edit-actions'
import { toggleDualDialogue } from '@/actions/format-actions'
import { AddToDictionaryMenuItem } from './sub-menus/dictionary/AddToDictionaryMenuItem'
import { EditActionsMenu } from './sub-menus/edit/EditActionsMenu'
import { ElementTypeMenu } from './sub-menus/element/ElementTypeMenu'
import { GrammarSuggestionItems } from './sub-menus/dictionary/GrammarSuggestionItems'
import { ProductionTagMenuItems } from './sub-menus/notes/ProductionTagMenuItems'
import { ScriptNoteMenuItems } from './sub-menus/notes/ScriptNoteMenuItems'
import { RollAnchorMenuItems } from './sub-menus/rolls/RollAnchorMenuItems'
import { SpellingSuggestionItems } from './sub-menus/dictionary/SpellingSuggestionItems'
import { TextStyleMenu } from './sub-menus/style/TextStyleMenu'
import { getExistingAnnotations } from './helpers/getExistingAnnotations'
import type { ScriptContextMenuProps } from './types'
import { useElementFormatting } from '@/actions/useElementFormatting'
import { useGrammarActions } from '@/actions/useGrammarActions'
import { useProductionTagActions } from '@/actions/useProductionTagActions'
import { useScriptNoteActions } from '@/actions/useScriptNoteActions'
import { useRollAnchorActions } from '@/actions/useRollAnchorActions'
import { useSelectionRestore } from '@/actions/useSelectionRestore'
import { useSpellingActions } from '@/actions/useSpellingActions'
import { DUAL_DIALOGUE_TYPES } from './constants'
import { useActivityBarStore } from '@/stores/activity-bar-store'

export function ScriptContextMenu({
  editor,
  position,
  spellInfo,
  grammarInfo,
  onClose,
  overrideSelection,
  onOpenRollDialog,
}: ScriptContextMenuProps) {
  const { savedSelection, resolvedFrom, currentNodeType, hasSelection } =
    useSelectionRestore(editor, overrideSelection)
  const { existingNoteId, existingTagInfo, existingRollAnchorId } =
    getExistingAnnotations(editor)
  const rollAnchor = useRollAnchorActions(editor, onClose, existingRollAnchorId)

  const formatting = useElementFormatting(editor)
  const notes = useScriptNoteActions(
    editor,
    onClose,
    currentNodeType,
    resolvedFrom,
    hasSelection,
    savedSelection,
    existingNoteId,
  )
  const tags = useProductionTagActions(
    editor,
    onClose,
    currentNodeType,
    resolvedFrom,
    savedSelection,
    existingTagInfo,
  )
  const spelling = useSpellingActions(editor, onClose, spellInfo)
  const grammar = useGrammarActions(editor, onClose, grammarInfo)

  const toggleCharacterProfiles = useEditorStore(
    (state) => state.toggleCharacterProfiles,
  )
  const characterProfilesOpen = useEditorStore(
    (state) => state.characterProfilesOpen,
  )
  const setActiveView = useActivityBarStore((state) => state.setActiveView)

  const showSceneProperties = currentNodeType === 'sceneHeading'
  const showCharacterProfile = DUAL_DIALOGUE_TYPES.has(currentNodeType)
  const showDualDialogue = DUAL_DIALOGUE_TYPES.has(currentNodeType)

  const activeStyleStates = {
    bold: editor.isActive('bold'),
    italic: editor.isActive('italic'),
    underline: editor.isActive('underline'),
    strike: editor.isActive('strike'),
    subscript: editor.isActive('subscript'),
    superscript: editor.isActive('superscript'),
  }

  const virtualAnchor = useMemo(
    () => ({
      getBoundingClientRect: () => new DOMRect(position.x, position.y, 0, 0),
    }),
    [position.x, position.y],
  )

  return (
    <ContextMenu open onOpenChange={(open) => !open && onClose()}>
      <ContextMenuContent anchor={virtualAnchor} className="w-60">
        {spellInfo && (
          <SpellingSuggestionItems
            spellInfo={spellInfo}
            onApply={spelling.applySuggestion}
          />
        )}

        {grammarInfo && (
          <GrammarSuggestionItems
            grammarInfo={grammarInfo}
            onApply={grammar.applySuggestion}
            onIgnoreOnce={grammar.ignoreOnce}
            onIgnoreRuleForDocument={grammar.ignoreRuleForDocument}
            onDisableRule={grammar.disableRule}
          />
        )}

        <EditActionsMenu
          hasSelection={hasSelection}
          onUndo={() => handleUndo(editor)}
          onRedo={() => handleRedo(editor)}
          onCut={() => handleCut(editor)}
          onCopy={() => handleCopy(editor)}
          onPaste={() => handlePaste(editor)}
          onPasteWithoutFormatting={() => handlePaste(editor)}
          onSelectAll={() => handleSelectAll(editor)}
          onDelete={() =>
            hasSelection && editor.chain().focus().deleteSelection().run()
          }
        />

        <ElementTypeMenu
          currentNodeType={currentNodeType}
          activeTemplate={formatting.activeTemplate}
          onSelect={formatting.setElement}
        />

        <TextStyleMenu
          activeStates={activeStyleStates}
          locked={formatting.locked}
          onToggleBold={formatting.toggleBold}
          onToggleItalic={formatting.toggleItalic}
          onToggleUnderline={formatting.toggleUnderline}
          onToggleStrike={formatting.toggleStrike}
          onToggleSubscript={formatting.toggleSubscript}
          onToggleSuperscript={formatting.toggleSuperscript}
          onToggleAllCaps={formatting.toggleAllCaps}
        />

        {showSceneProperties && (
          <ContextMenuItem disabled>Scene Properties...</ContextMenuItem>
        )}
        {showCharacterProfile && (
          <ContextMenuItem
            onClick={() => {
              if (!characterProfilesOpen) toggleCharacterProfiles()
              setActiveView('characters')
            }}
          >
            Character Profile...
          </ContextMenuItem>
        )}
        {showDualDialogue && (
          <ContextMenuItem onClick={() => toggleDualDialogue(editor)}>
            Dual Dialogue
          </ContextMenuItem>
        )}
        {(showSceneProperties || showCharacterProfile || showDualDialogue) && (
          <ContextMenuSeparator />
        )}

        <ScriptNoteMenuItems
          existingNoteId={existingNoteId}
          onAdd={notes.addScriptNote}
          onEdit={notes.editScriptNote}
          onDelete={notes.deleteScriptNote}
        />
        <RollAnchorMenuItems
          existingRollAnchorId={existingRollAnchorId}
          onOpenRollDialog={() => {
            const insertPos = savedSelection.from
            onClose()
            onOpenRollDialog(insertPos)
          }}
          onDelete={rollAnchor.deleteRollAnchor}
        />
        <ContextMenuSeparator />

        <ProductionTagMenuItems
          hasExistingTag={Boolean(existingTagInfo)}
          onEdit={tags.editTag}
          onRemove={tags.removeTag}
          onTagAs={tags.tagAs}
        />

        {spellInfo && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={spelling.ignoreWord}>
              Ignore Spelling
            </ContextMenuItem>
            <AddToDictionaryMenuItem
              onAddToTarget={spelling.addToDictionary}
              onAddToDefault={spelling.addToDefaultDictionary}
            />
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
