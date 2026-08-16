import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewTab } from './OverviewTab'
import { TemplatesTab } from './TemplatesTab'
import { PanelsTab } from './PanelsTab'
import { ShortcutsTab } from './ShortcutsTab'

export type HelpTab = 'overview' | 'templates' | 'panels' | 'shortcuts'

interface HelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: HelpTab
}

export default function HelpDialog({
  open,
  onOpenChange,
  initialTab = 'overview',
}: HelpDialogProps) {
  const [tab, setTab] = useState<HelpTab>(initialTab)

  // Re-sync to the requested tab each time the dialog is opened (e.g.
  // Help ▸ Keyboard Shortcuts should always land on the Shortcuts tab).
  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col sm:max-w-3xl max-h-[85dvh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Help</DialogTitle>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => v && setTab(v as HelpTab)}
          className="flex flex-col flex-1 min-h-0"
        >
          <TabsList className="shrink-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="panels">Panels</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 min-h-0">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="templates" className="flex-1 min-h-0">
            <TemplatesTab />
          </TabsContent>
          <TabsContent value="panels" className="flex-1 min-h-0">
            <PanelsTab />
          </TabsContent>
          <TabsContent value="shortcuts" className="flex-1 min-h-0">
            <ShortcutsTab />
          </TabsContent>
        </Tabs>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
