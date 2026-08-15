import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { useOracleActivityStore, type OracleActivity } from '@/stores/oracleActivityStore'
import StoryCubesRoller from '@/oracles/components/StoryCubesRoller'
import ComboRoller from '@/oracles/components/ComboRoller'
import FateChartRoller from '@/oracles/components/FateChartRoller'
import HitRoller from '@/oracles/components/HitRoller'
import FormulaRoller from '@/oracles/components/FormulaRoller'
import OracleBrowserFull from '@/oracles/components/OracleBrowserFull'

export default function OracleScreen() {
  const activeActivity = useOracleActivityStore((s) => s.activeActivity)
  const setActiveActivity = useOracleActivityStore((s) => s.setActiveActivity)

  return (
    <div className="h-full w-full overflow-y-auto p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">Oracles</h1>
        <Tabs
          value={activeActivity}
          onValueChange={(v) => setActiveActivity(v as OracleActivity)}
        >
          <TabsList>
            <TabsTrigger value="inspiration">Inspiration</TabsTrigger>
            <TabsTrigger value="roller">Roller</TabsTrigger>
            <TabsTrigger value="oracle">Oracle</TabsTrigger>
          </TabsList>

          <TabsContent value="inspiration">
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Story Cubes</CardTitle>
                </CardHeader>
                <CardContent>
                  <StoryCubesRoller />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Combos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ComboRoller />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="roller">
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fate Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <FateChartRoller />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Hit Roll</CardTitle>
                </CardHeader>
                <CardContent>
                  <HitRoller />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Formula</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormulaRoller />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="oracle">
            <OracleBrowserFull />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
