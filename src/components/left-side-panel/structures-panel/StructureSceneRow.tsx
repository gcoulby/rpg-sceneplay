import React from 'react'
import type { ScriptStructureScene } from './structureTypes'

interface StructureSceneRowProps {
  scene: ScriptStructureScene
  onSelectScene: (sceneIndex: number) => void
}

const StructureSceneRow: React.FC<StructureSceneRowProps> = ({
  scene,
  onSelectScene,
}) => (
  <div
    className="flex items-center gap-2 px-3 py-1.25 cursor-pointer transition-colors duration-100 hover:bg-(--fd-overlay-subtle)"
    onClick={() => onSelectScene(scene.sceneIndex)}
  >
    <span className="text-[10px] text-(--fd-text-muted) min-w-5.5 shrink-0">
      {scene.sceneIndex + 1}
    </span>
    <span className="text-xs text-(--fd-text) whitespace-nowrap overflow-hidden text-ellipsis flex-1">
      {scene.heading}
    </span>
  </div>
)

export default StructureSceneRow
