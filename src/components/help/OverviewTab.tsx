import { ScrollArea } from '@/components/ui/scroll-area'
import { OVERVIEW } from './helpContent'

export function OverviewTab() {
  return (
    <ScrollArea className="h-[55dvh]">
      <div className="flex flex-col gap-4 pr-3 text-sm">
        <p className="text-muted-foreground">{OVERVIEW.whatItIs}</p>

        <div className="rounded-md border border-(--fd-border) bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Attribution
          </p>
          <p>{OVERVIEW.attribution}</p>
        </div>

        <div>
          <p className="font-semibold mb-1">Why this exists</p>
          <p className="text-muted-foreground">{OVERVIEW.whyItExists}</p>
        </div>

        <div>
          <p className="font-semibold mb-1">What it aims to do</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            {OVERVIEW.goals.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
        </div>
      </div>
    </ScrollArea>
  )
}
