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
import { getElementShortcuts, getGeneralShortcuts, SHORTCUTS_NOTE } from './helpContent'

function ShortcutRows({ rows }: { rows: { label: string; keys: string }[] }) {
  return (
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.label}>
          <TableCell>{row.label}</TableCell>
          <TableCell className="text-right font-mono text-xs whitespace-nowrap">
            {row.keys}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )
}

export function ShortcutsTab() {
  const mod = getShortcutModifier()

  return (
    <ScrollArea className="h-[55dvh]">
      <div className="flex flex-col gap-4 pr-3 text-sm">
        <div>
          <p className="font-semibold mb-2">Element shortcuts</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Element</TableHead>
                <TableHead className="text-right">Shortcut</TableHead>
              </TableRow>
            </TableHeader>
            <ShortcutRows rows={getElementShortcuts(mod)} />
          </Table>
        </div>

        <div>
          <p className="font-semibold mb-2">General</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead className="text-right">Shortcut</TableHead>
              </TableRow>
            </TableHeader>
            <ShortcutRows rows={getGeneralShortcuts(mod)} />
          </Table>
        </div>

        <p className="text-xs text-muted-foreground border-t border-(--fd-border) pt-3">
          {SHORTCUTS_NOTE}
        </p>
      </div>
    </ScrollArea>
  )
}
