import React from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import ChartCard from './ChartCard'
import type {
  computeCharacterPresence,
  computePacingData,
} from '@/utils/open-draft/scriptStatistics'

interface CharacterPresenceCardProps {
  data: ReturnType<typeof computeCharacterPresence>
  pacingData: ReturnType<typeof computePacingData>
  sceneHeadings: string[]
}

const CharacterPresenceCard: React.FC<CharacterPresenceCardProps> = ({
  data,
  pacingData,
  sceneHeadings,
}) => {
  if (data.length === 0) return null

  return (
    <ChartCard title="Character Presence by Scene">
      <div className="-mx-4 px-4 overflow-x-auto">
        <Table className="[&_td]:p-[3px] [&_th]:p-[3px] text-[11px] [&_td]:text-center [&_th]:text-center whitespace-nowrap">
          <TableHeader>
            <TableRow>
              <TableHead className="!text-left !pr-3 sticky left-0 bg-(--fd-dropdown-bg) z-1 min-w-[100px] text-(--fd-text) font-medium">
                Character
              </TableHead>
              {pacingData.map((_, i) => (
                <TableHead
                  key={i}
                  className="text-[9px] text-(--fd-text-muted) min-w-[18px] !font-normal"
                  title={sceneHeadings[i]}
                >
                  {i + 1}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 20).map((cp) => (
              <TableRow key={cp.name}>
                <TableCell className="!text-left !pr-3 sticky left-0 bg-(--fd-dropdown-bg) z-1 min-w-[100px] text-(--fd-text) font-medium">
                  <span
                    className="inline-block mr-1.5 rounded-full w-2 h-2 align-middle"
                    style={{ background: cp.color || '#666' }}
                  />
                  {cp.name}
                </TableCell>
                {cp.scenes.map((present, i) => (
                  <TableCell key={i} className="min-w-[18px] h-[18px]">
                    {present && (
                      <span
                        className="inline-block rounded-sm w-2.5 h-2.5"
                        style={{ background: cp.color || '#3b82f6' }}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ChartCard>
  )
}

export default CharacterPresenceCard
