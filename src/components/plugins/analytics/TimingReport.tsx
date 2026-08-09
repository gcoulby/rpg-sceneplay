import React from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  formatRuntime,
  formatSceneDuration,
  getTimingColor,
} from '@/utils/open-draft/scriptTiming'
import type { computeSceneTiming } from '@/utils/open-draft/scriptTiming'
import { Card, CardContent } from '@/components/ui/card'

interface TimingReportProps {
  timing: ReturnType<typeof computeSceneTiming>
}

const TimingReport: React.FC<TimingReportProps> = ({ timing }) => (
  <Card className="bg-muted rounded-md">
    <CardContent>
      <h3 className="m-0 font-semibold text-[13px] text-(--fd-text) uppercase tracking-[0.3px]">
        Timing Report
      </h3>
      <div className="text-[13px] text-(--fd-text-muted)">
        Estimated runtime:{' '}
        <span className="font-semibold text-(--fd-text)">
          {formatRuntime(timing.totalSeconds)}
        </span>{' '}
        across {timing.scenes.length} scenes.
      </div>
      <div className="flex-1 p-5 overflow-y-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Scene</TableHead>
              <TableHead>Dialogue</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Est.</TableHead>
              <TableHead>Cumulative</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timing.scenes.map((st) => (
              <TableRow key={st.sceneIndex}>
                <TableCell>{st.sceneIndex + 1}</TableCell>
                <TableCell className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {st.heading}
                </TableCell>
                <TableCell>
                  {formatSceneDuration(st.breakdown.dialogueSeconds)}
                </TableCell>
                <TableCell>
                  {formatSceneDuration(st.breakdown.actionSeconds)}
                </TableCell>
                <TableCell
                  style={{
                    color: getTimingColor(st.finalSeconds),
                    fontWeight: 600,
                  }}
                >
                  {formatSceneDuration(st.finalSeconds)}
                  {st.overrideSeconds != null && (
                    <span title="Manual override"> *</span>
                  )}
                </TableCell>
                <TableCell>{formatRuntime(st.cumulativeSeconds)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold border-t-2 border-(--fd-border)">
              <TableCell />
              <TableCell>TOTAL</TableCell>
              <TableCell />
              <TableCell />
              <TableCell>{formatRuntime(timing.totalSeconds)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
)

export default TimingReport
