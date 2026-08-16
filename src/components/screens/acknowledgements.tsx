import { useMemo } from 'react'
import { useOracleStore } from '@/stores/oracleStore'
import type { OracleCollection, OracleSource } from '@/oracles/types'
import { TOOL_CREDITS } from '@/oracles/toolCredits'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

function SourceCard({ source }: { source: OracleSource }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{source.name}</CardTitle>
        <CardDescription>{source.author}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        <span>License: {source.license}</span>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {source.url}
          </a>
        )}
        {source.note && (
          <span className="text-muted-foreground">{source.note}</span>
        )}
      </CardContent>
    </Card>
  )
}

function collectSourceIds(
  collections: OracleCollection[],
  into: Set<string>,
): void {
  for (const collection of collections) {
    into.add(collection.sourceId)
    for (const child of collection.children) {
      if ('children' in child) collectSourceIds([child], into)
      else into.add(child.sourceId)
    }
  }
}

export default function Acknowledgements() {
  const getAllCollections = useOracleStore((s) => s.getAllCollections)
  const getAllCombos = useOracleStore((s) => s.getAllCombos)
  const getAllSources = useOracleStore((s) => s.getAllSources)

  const sources = useMemo(() => {
    const sourceIds = new Set<string>()
    collectSourceIds(getAllCollections(), sourceIds)
    for (const combo of getAllCombos()) sourceIds.add(combo.sourceId)

    const bySourceId = new Map<string, OracleSource>(
      getAllSources().map((source) => [source.id, source]),
    )
    return [...sourceIds]
      .map((id) => bySourceId.get(id))
      .filter((source): source is OracleSource => source !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [getAllCollections, getAllCombos, getAllSources])

  return (
    <div className="h-full w-full overflow-y-auto p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Acknowledgements</h1>
          <p className="text-muted-foreground text-sm">
            Every oracle and table source currently in use, with its
            licensing and attribution.
          </p>
        </div>
        {sources.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}

        <div className="mt-4">
          <h2 className="text-lg font-semibold">Tools & Inspiration</h2>
          <p className="text-muted-foreground text-sm">
            Tools and mechanics this app builds on that aren't oracle table
            data.
          </p>
        </div>
        {TOOL_CREDITS.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>
    </div>
  )
}
