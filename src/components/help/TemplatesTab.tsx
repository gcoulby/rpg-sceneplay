import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getShortcutModifier } from '@/utils/shortcutModifier'
import { RPG_ELEMENT_TABLE, TEMPLATES } from './helpContent'

export function TemplatesTab() {
  const mod = getShortcutModifier()

  return (
    <ScrollArea className="h-[55dvh]">
      <div className="flex flex-col gap-4 pr-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-(--fd-border) p-3">
            <p className="font-semibold mb-1">Film Screenplay</p>
            <p className="text-muted-foreground">{TEMPLATES.filmScreenplay}</p>
          </div>
          <div className="rounded-md border border-(--fd-border) p-3">
            <p className="font-semibold mb-1">RPG Sceneplay (S.T.A.R.T.)</p>
            <p className="text-muted-foreground">{TEMPLATES.rpgSceneplay}</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Element</TableHead>
              <TableHead className="text-right">Shortcut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RPG_ELEMENT_TABLE.map((el) => (
              <TableRow key={el.id}>
                <TableCell className="text-muted-foreground">
                  {el.shortcutDigit}
                </TableCell>
                <TableCell>{el.label}</TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {mod}
                  {el.shortcutDigit}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div>
          <p className="font-semibold mb-1">Enter-key flow</p>
          <p className="text-muted-foreground">{TEMPLATES.enterFlow}</p>
        </div>

        <div>
          <p className="font-semibold mb-1">Importing other formats</p>
          <p className="text-muted-foreground">{TEMPLATES.importMapping}</p>
        </div>
      </div>
    </ScrollArea>
  )
}
