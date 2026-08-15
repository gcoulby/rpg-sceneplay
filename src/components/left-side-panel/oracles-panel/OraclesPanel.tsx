import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOracleActivityStore, type OracleActivity } from '@/stores/oracleActivityStore'
import StoryCubesRoller from '@/oracles/components/StoryCubesRoller'
import ActionThemeRoller from '@/oracles/components/ActionThemeRoller'
import FateChartRoller from '@/oracles/components/FateChartRoller'
import HitRoller from '@/oracles/components/HitRoller'
import FormulaRoller from '@/oracles/components/FormulaRoller'
import OracleTableBrowser from '@/oracles/components/OracleTableBrowser'

export default function OraclesPanel() {
  const activeActivity = useOracleActivityStore((s) => s.activeActivity)
  const setActiveActivity = useOracleActivityStore((s) => s.setActiveActivity)

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <div className="flex items-center px-3 py-2.5 border-b border-(--fd-border) shrink-0 gap-2">
        <span className="font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
          Oracles
        </span>
      </div>

      <Tabs
        value={activeActivity}
        onValueChange={(v) => setActiveActivity(v as OracleActivity)}
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full shrink-0 rounded-none border-b border-(--fd-border) bg-transparent h-auto p-0">
          <TabsTrigger
            value="inspiration"
            className="flex-1 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-(--fd-accent)"
          >
            Inspiration
          </TabsTrigger>
          <TabsTrigger
            value="roller"
            className="flex-1 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-(--fd-accent)"
          >
            Roller
          </TabsTrigger>
          <TabsTrigger
            value="oracle"
            className="flex-1 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-(--fd-accent)"
          >
            Oracle
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="inspiration"
          className="flex flex-col flex-1 min-h-0 overflow-y-auto p-3 gap-4"
        >
          <StoryCubesRoller compact />
          <ActionThemeRoller compact />
        </TabsContent>

        <TabsContent
          value="roller"
          className="flex flex-col flex-1 min-h-0 overflow-y-auto p-3 gap-4"
        >
          <FateChartRoller compact />
          <HitRoller compact />
          <FormulaRoller compact />
        </TabsContent>

        <TabsContent
          value="oracle"
          className="flex flex-col flex-1 min-h-0 overflow-y-auto p-3"
        >
          <OracleTableBrowser compact />
        </TabsContent>
      </Tabs>
    </div>
  )
}
