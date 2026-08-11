import React from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'

interface CharacterSceneChipsProps {
  scenes: string[]
  onNavigateToScene: (sceneText: string) => void
}

const CharacterSceneChips: React.FC<CharacterSceneChipsProps> = ({
  scenes,
  onNavigateToScene,
}) => {
  if (scenes.length === 0) return null

  return (
    <Collapsible className="my-1">
      <CollapsibleTrigger className="text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block cursor-pointer select-none hover:text-(--fd-text)">
        Appears in ({scenes.length} scenes)
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-wrap gap-0.75 pt-1">
          {scenes.map((s, i) => (
            <Badge
              key={i}
              variant="outline"
              className="max-w-32.5 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer text-[9px] text-(--fd-text-muted) hover:border-(--fd-accent) hover:text-(--fd-text)"
              onClick={() => onNavigateToScene(s)}
              title={`Go to: ${s}`}
            >
              {s}
            </Badge>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default CharacterSceneChips
