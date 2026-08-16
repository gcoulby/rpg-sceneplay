import { ScrollArea } from '@/components/ui/scroll-area'
import { MAIN_TABS, ROLL_DIALOG_NOTE, SIDEBAR_PANELS } from './helpContent'

function PanelList({
  items,
}: {
  items: { name: string; description: string }[]
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.name} className="text-sm">
          <span className="font-semibold">{item.name}</span>
          <span className="text-muted-foreground"> — {item.description}</span>
        </li>
      ))}
    </ul>
  )
}

export function PanelsTab() {
  return (
    <ScrollArea className="h-[55dvh]">
      <div className="flex flex-col gap-4 pr-3">
        <div>
          <p className="font-semibold text-sm mb-2">Sidebar panels</p>
          <PanelList items={SIDEBAR_PANELS} />
        </div>

        <div>
          <p className="font-semibold text-sm mb-2">Main tabs</p>
          <PanelList items={MAIN_TABS} />
        </div>

        <p className="text-xs text-muted-foreground border-t border-(--fd-border) pt-3">
          {ROLL_DIALOG_NOTE}
        </p>
      </div>
    </ScrollArea>
  )
}
