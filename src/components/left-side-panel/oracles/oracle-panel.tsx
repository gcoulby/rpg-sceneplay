import * as ActivityPanel from '@/components/ui/activity-panel'
import OracleTableBrowser from '@/oracles/components/OracleTableBrowser'

export const OraclePanel = () => {
  return (
    <ActivityPanel.Shell>
      <ActivityPanel.Header>
        <ActivityPanel.Title>Oracles</ActivityPanel.Title>
      </ActivityPanel.Header>
      <ActivityPanel.Content>
        <OracleTableBrowser compact />
      </ActivityPanel.Content>
    </ActivityPanel.Shell>
  )
}
