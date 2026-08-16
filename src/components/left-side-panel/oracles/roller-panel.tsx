import * as ActivityPanel from '@/components/ui/activity-panel'
import { Separator } from '@/components/ui/separator'
import FateChartRoller from '@/oracles/components/FateChartRoller'
import FormulaRoller from '@/oracles/components/FormulaRoller'
import HitRoller from '@/oracles/components/HitRoller'

export const RollerPanel = () => {
  //This needs to change to some sort of store
  const rollers = [FateChartRoller, HitRoller, FormulaRoller]
  return (
    <ActivityPanel.Shell>
      <ActivityPanel.Header>
        <ActivityPanel.Title>Dice Roller</ActivityPanel.Title>
      </ActivityPanel.Header>
      <ActivityPanel.Content>
        {rollers.map((Roller, i) => {
          if (i < rollers.length) {
            return (
              <>
                <Roller compact key={i} />
                <Separator className="my-4" />
              </>
            )
          }
          return <Roller compact key={i} />
        })}
        {/* <FateChartRoller compact />
        <HitRoller compact />
        <FormulaRoller compact /> */}
      </ActivityPanel.Content>
    </ActivityPanel.Shell>
  )
}
