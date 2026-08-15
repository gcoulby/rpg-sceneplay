import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  useOracleActivityStore,
  type OracleActivity,
} from '@/stores/oracleActivityStore'
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
    <div className="p-6 w-full h-full overflow-y-auto">
      <div className="flex flex-col gap-4 mx-auto max-w-6xl">
        <h1 className="font-semibold text-2xl">Oracles</h1>
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
            <div className="flex flex-col gap-4 mx-auto max-w-4xl">
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
            <div className="flex flex-col gap-4 mx-auto max-w-4xl">
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
                  <CardTitle>Dice Roller</CardTitle>
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
