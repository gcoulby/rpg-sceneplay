import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import pkg from '@/../package.json'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
// import { generateDiagnosticsReport } from './diagnostics-report'

interface DiagnosticsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

import { useEffect, useState } from 'react'
import { generateDiagnosticsReport } from './diagnostics-report'
import { ScrollArea } from '@/components/ui/scroll-area'

// Flattens a nested object into { key, value } rows for the table.
// "browser.version" style keys become "Browser Version" for display.
// Arrays are joined with commas; null/undefined are shown as "—".
function flattenForTable(
  obj: Record<string, unknown>,
  prefix = '',
): { key: string; value: string }[] {
  return Object.entries(obj).flatMap(([rawKey, rawValue]) => {
    const label = prefix
      ? `${prefix} ${toTitleCase(rawKey)}`
      : toTitleCase(rawKey)

    if (rawValue === null || rawValue === undefined) {
      return [{ key: label, value: '—' }]
    }

    if (Array.isArray(rawValue)) {
      return [
        { key: label, value: rawValue.length ? rawValue.join(', ') : '—' },
      ]
    }

    if (typeof rawValue === 'object') {
      return flattenForTable(rawValue as Record<string, unknown>, label)
    }

    return [{ key: label, value: String(rawValue) }]
  })
}

function toTitleCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> camel Case
    .replace(/^./, (c) => c.toUpperCase())
}

export default function DiagnosticsDialog({
  open,
  onOpenChange,
}: DiagnosticsDialogProps) {
  const [diagnostics, setDiagnostics] = useState<
    { key: string; value: string }[]
  >([])
  const [rawReport, setRawReport] = useState<Record<string, unknown> | null>(
    null,
  )
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    generateDiagnosticsReport().then((report) => {
      if (cancelled) return

      const merged = {
        name: pkg.name,
        version: pkg.version,
        ...report,
      }

      setRawReport(merged)
      setDiagnostics(flattenForTable(merged))
    })

    return () => {
      cancelled = true
    }
  }, [open])

  const handleCopy = async () => {
    if (!rawReport) return
    await navigator.clipboard.writeText(JSON.stringify(rawReport, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[50dvw] max-h-[80dvh] text-center">
        <DialogHeader>
          <DialogTitle className="text-center">Diagnostics</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[50dvh] text-left">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Key</TableHead>
                <TableHead className="w-2/3">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diagnostics
                .filter((x) => x.key !== 'Raw User Agent')
                .map((diagnostic) => (
                  <TableRow key={diagnostic.key}>
                    <TableCell className="font-medium">
                      {diagnostic.key}
                    </TableCell>
                    <TableCell className="font-extralight wrap-break-word">
                      {diagnostic.value}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter className="sm:justify-center">
          <div className="flex flex-col gap-3">
            <p className="flex w-full text-xs">
              Runtime info to attach to bug reports. Click "Copy" to copy the
              full report to your clipboard, then paste it into the GitHub
              issue.
            </p>

            <div className="flex sm:justify-center gap-2">
              <Button
                variant="outline"
                onClick={handleCopy}
                disabled={!rawReport}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
