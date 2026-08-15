import * as ActivityPanel from '@/components/ui/activity-panel'
import ComboRoller from '@/oracles/components/ComboRoller'
import StoryCubesRoller from '@/oracles/components/StoryCubesRoller'

export const InspirationPanel = () => {
  return (
    <ActivityPanel.Shell>
      <ActivityPanel.Header>
        <ActivityPanel.Title>Inspiration</ActivityPanel.Title>
      </ActivityPanel.Header>
      <ActivityPanel.Content>
        <StoryCubesRoller compact />
        <ComboRoller compact />
      </ActivityPanel.Content>
    </ActivityPanel.Shell>
  )
}
