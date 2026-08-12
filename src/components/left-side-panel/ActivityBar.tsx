import React from 'react'
import { useSidebar } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { NAV_VIEWS, type NavView } from '@/stores/activity-bar-store'
import { Button } from '../ui/button'

interface ActivityBarProps {
  activeView: NavView
  onSelectView: (view: NavView) => void
}

const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  onSelectView,
}) => {
  const { open, setOpen } = useSidebar()

  const handleClick = (view: NavView) => {
    if (view === activeView) {
      setOpen(!open)
      onSelectView('')
      return
    }
    onSelectView(view)
    if (!open) setOpen(true)
  }

  return (
    <div className="flex flex-col items-center w-12 shrink-0  border-r border-(--fd-border) py-2 gap-1">
      {NAV_VIEWS.map(({ id, label, icon: Icon }) => {
        const isActive = id === activeView && open
        return (
          <Tooltip key={id}>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  aria-label={label}
                  aria-pressed={isActive}
                  onClick={() => handleClick(id)}
                  variant="ghost"
                  className={`relative flex items-center justify-center w-10 h-10 rounded-md transition-colors duration-100 cursor-pointer ${
                    isActive
                      ? 'text-(--fd-text) bg-(--fd-overlay-subtle)'
                      : 'text-(--fd-text-muted) hover:text-(--fd-text) hover:bg-(--fd-overlay-subtle)'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-(--fd-accent)" />
                  )}
                  <Icon size={20} className="size-6" strokeWidth={1.75} />
                </Button>
              }
            />
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export default ActivityBar
