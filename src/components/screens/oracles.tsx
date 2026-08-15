import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { useOracleActivityStore, type OracleActivity } from '@/stores/oracleActivityStore'
import StoryCubesRoller from '@/oracles/components/StoryCubesRoller'
import ActionThemeRoller from '@/oracles/components/ActionThemeRoller'
import FateChartRoller from '@/oracles/components/FateChartRoller'
import HitRoller from '@/oracles/components/HitRoller'
import FormulaRoller from '@/oracles/components/FormulaRoller'
import OracleTableBrowser from '@/oracles/components/OracleTableBrowser'

export default function OracleScreen() {
  const activeActivity = useOracleActivityStore((s) => s.activeActivity)
  const setActiveActivity = useOracleActivityStore((s) => s.setActiveActivity)

  return (
    <div className="h-full w-full overflow-y-auto p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
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
            <div className="flex flex-col gap-4">
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
                  <CardTitle>Action / Theme</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActionThemeRoller />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="roller">
            <div className="flex flex-col gap-4">
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
            <Card>
              <CardHeader>
                <CardTitle>Oracle Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <OracleTableBrowser />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
