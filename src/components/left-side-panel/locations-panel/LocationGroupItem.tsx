import React from 'react'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMapStore } from '@/components/screens/map/useMapStore'
import { useMainTabStore } from '@/stores/mainTabStore'
import type { LocationGroup } from '../utils/scene-utils'

interface LocationGroupItemProps {
  group: LocationGroup
  isRenaming: boolean
  renameValue: string
  onStartRename: () => void
  onRenameValueChange: (v: string) => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
  renameInputRef: React.RefObject<HTMLInputElement | null>
  onSelectScene: (sceneIndex: number) => void
}

const LocationGroupItem: React.FC<LocationGroupItemProps> = ({
  group,
  isRenaming,
  renameValue,
  onStartRename,
  onRenameValueChange,
  onRenameSubmit,
  onRenameCancel,
  renameInputRef,
  onSelectScene,
}) => {
  const key = group.name.toUpperCase()
  const mapRef = useMapStore((s) => s.locationMapRefs[key])
  const map = useMapStore((s) => s.map)
  const setPendingLocationLink = useMapStore((s) => s.setPendingLocationLink)
  const removeLocationMapRef = useMapStore((s) => s.removeLocationMapRef)
  const setActiveTab = useMainTabStore((s) => s.setActiveTab)

  const handleAddToMap = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPendingLocationLink(group.name)
    setActiveTab('map')
  }

  return (
    <AccordionItem
      value={key}
      className="border-b border-(--fd-overlay-subtle)"
    >
      {/* AccordionTrigger ships its own chevron + rotate animation, so the
          hand-rolled ▾ span from the old code is gone — the component
          already does this. */}
      <AccordionTrigger className="px-3 py-2 gap-1.5 hover:no-underline hover:bg-(--fd-overlay-subtle)">
        <span className="flex-1 text-sm [font-family:var(--screenplay-font)] text-(--fd-text) whitespace-nowrap overflow-hidden text-ellipsis font-semibold text-left">
          {group.name}
        </span>
        <span className="text-[11px] text-(--fd-text) opacity-70 bg-(--fd-overlay-light) px-2 py-0.5 rounded-lg shrink-0 font-medium">
          {group.sceneIndices.length}
        </span>
      </AccordionTrigger>

      <AccordionContent className="px-3 pt-0 pb-2">
        {isRenaming ? (
          <div className="mb-1.5">
            <Input
              ref={renameInputRef}
              className="w-full text-xs [font-family:var(--screenplay-font)]"
              value={renameValue}
              onChange={(e) =>
                onRenameValueChange(e.target.value.toUpperCase())
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameSubmit()
                if (e.key === 'Escape') onRenameCancel()
              }}
              onBlur={onRenameSubmit}
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            <Button
              variant="outline"
              size="sm"
              className="px-2 py-0.75 h-auto text-[10px]"
              onClick={(e) => {
                e.stopPropagation()
                onStartRename()
              }}
            >
              Rename Location
            </Button>
            {map && !mapRef && (
              <Button
                variant="outline"
                size="sm"
                className="px-2 py-0.75 h-auto text-[10px]"
                onClick={handleAddToMap}
              >
                Add to Map
              </Button>
            )}
            {mapRef && (
              <Button
                variant="outline"
                size="sm"
                className="px-2 py-0.75 h-auto text-[10px]"
                onClick={(e) => {
                  e.stopPropagation()
                  removeLocationMapRef(group.name)
                }}
              >
                Remove from Map
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          {group.sceneIndices.map((sceneIdx, i) => (
            <div
              key={sceneIdx}
              className="flex items-start gap-1.5 px-2 py-1.5 rounded-[3px] cursor-pointer text-xs text-(--fd-text) opacity-80 transition-colors duration-100 min-h-8 hover:bg-[rgba(74,158,255,0.1)] hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                onSelectScene(sceneIdx)
              }}
            >
              <span className="text-(--fd-accent) font-semibold shrink-0 min-w-5 mt-px">
                {sceneIdx + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-(--fd-text) opacity-70">
                    {group.prefixes[i]}
                  </span>
                  {group.times[i] && (
                    <span className="text-[11px] text-(--fd-text) opacity-60 ml-auto">
                      {group.times[i]}
                    </span>
                  )}
                </div>
                {group.preambles[i] && (
                  <div className="text-[11px] text-(--fd-text) opacity-50 whitespace-nowrap overflow-hidden text-ellipsis mt-px">
                    {group.preambles[i]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export default LocationGroupItem
