import {
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu'
import { PROJECT_DICT_TARGET, spellChecker } from '@/editor/spellchecker'

interface AddToDictionaryMenuItemProps {
  onAddToTarget: (target: string) => void
  onAddToDefault: () => void
}

export function AddToDictionaryMenuItem({ onAddToTarget, onAddToDefault }: AddToDictionaryMenuItemProps) {
  const targets = spellChecker.getActiveAddTargets()

  if (targets.length <= 1) {
    return <ContextMenuItem onClick={onAddToDefault}>Add to Dictionary</ContextMenuItem>
  }

  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>Add to Dictionary…</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        {targets.map((target) => (
          <ContextMenuItem key={target} onClick={() => onAddToTarget(target)}>
            {target === PROJECT_DICT_TARGET ? 'Project dictionary' : target}
          </ContextMenuItem>
        ))}
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}
