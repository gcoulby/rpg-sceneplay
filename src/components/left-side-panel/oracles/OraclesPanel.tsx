import { useEffect, useRef, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useOracleActivityStore, type OracleActivity } from '@/stores/oracleActivityStore'
import StoryCubesRoller from '@/oracles/components/StoryCubesRoller'
import ComboRoller from '@/oracles/components/ComboRoller'
import FateChartRoller from '@/oracles/components/FateChartRoller'
import HitRoller from '@/oracles/components/HitRoller'
import FormulaRoller from '@/oracles/components/FormulaRoller'
import OracleTableBrowser from '@/oracles/components/OracleTableBrowser'

const ALL_ACTIVITIES: OracleActivity[] = ['inspiration', 'roller', 'oracle']

const ACTIVITY_LABELS: Record<OracleActivity, string> = {
  inspiration: 'Inspiration',
  roller: 'Roller',
  oracle: 'Oracle',
}

export default function OraclesPanel() {
  const activeActivity = useOracleActivityStore((s) => s.activeActivity)
  const setActiveActivity = useOracleActivityStore((s) => s.setActiveActivity)
  const [openSections, setOpenSections] = useState<OracleActivity[]>(ALL_ACTIVITIES)
  const sectionRefs = useRef<Record<OracleActivity, HTMLDivElement | null>>({
    inspiration: null,
    roller: null,
    oracle: null,
  })

  // Switching the activity from the main screen's tabs scrolls to (and,
  // via displayedOpen below, re-expands) the matching sidebar section,
  // without collapsing the rest.
  useEffect(() => {
    sectionRefs.current[activeActivity]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }, [activeActivity])

  const displayedOpen = openSections.includes(activeActivity)
    ? openSections
    : [...openSections, activeActivity]

  return (
    <div className="flex w-full h-full flex-col overflow-hidden">
      <div className="flex items-center px-3 py-2.5 border-b border-(--fd-border) shrink-0 gap-2">
        <span className="font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
          Oracles
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <Accordion
          value={displayedOpen}
          onValueChange={(v) => setOpenSections(v as OracleActivity[])}
        >
          <AccordionItem
            value="inspiration"
            ref={(el) => {
              sectionRefs.current.inspiration = el
            }}
          >
            <AccordionTrigger
              className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.5px] hover:no-underline"
              onClick={() => setActiveActivity('inspiration')}
            >
              {ACTIVITY_LABELS.inspiration}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 px-3">
              <StoryCubesRoller compact />
              <ComboRoller compact />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="roller"
            ref={(el) => {
              sectionRefs.current.roller = el
            }}
          >
            <AccordionTrigger
              className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.5px] hover:no-underline"
              onClick={() => setActiveActivity('roller')}
            >
              {ACTIVITY_LABELS.roller}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 px-3">
              <FateChartRoller compact />
              <HitRoller compact />
              <FormulaRoller compact />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="oracle"
            ref={(el) => {
              sectionRefs.current.oracle = el
            }}
          >
            <AccordionTrigger
              className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.5px] hover:no-underline"
              onClick={() => setActiveActivity('oracle')}
            >
              {ACTIVITY_LABELS.oracle}
            </AccordionTrigger>
            <AccordionContent className="px-3">
              <OracleTableBrowser compact />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
