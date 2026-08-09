import React, { useEffect, useMemo, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorStore } from '@/stores/editorStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  computeOverviewStats,
  computeCharacterDialogue,
  computeGenderBreakdown,
  computeSceneBreakdown,
  computePacingData,
  computeCharacterPresence,
} from '@/utils/open-draft/scriptStatistics'
import {
  computeSceneTiming,
  formatRuntime,
} from '@/utils/open-draft/scriptTiming'
import { formatEstimatedTime } from './constants'
import StatCard from './StatCard'
import DialogueDistributionCard from './DialogueDistributionCard'
import GenderAnalysisCard from './GenderAnalysisCard'
import SceneBreakdownCard from './SceneBreakdownCard'
import PacingCard from './PacingCard'
import CharacterPresenceCard from './CharacterPresenceCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import TimingReport from './TimingReport'

interface Props {
  editor: Editor
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ScriptStatisticsDialog: React.FC<Props> = ({
  editor,
  open,
  onOpenChange,
}) => {
  const {
    characterProfiles,
    pageCount,
    statisticsScrollTo,
    setStatisticsScrollTo,
  } = useEditorStore()

  const [doc, setDoc] = useState(() => editor.getJSON())
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setDoc(editor.getJSON())
    }
  }

  const overview = useMemo(
    () => computeOverviewStats(doc, pageCount),
    [doc, pageCount],
  )
  const charDialogue = useMemo(
    () => computeCharacterDialogue(doc, characterProfiles),
    [doc, characterProfiles],
  )
  const genderStats = useMemo(
    () => computeGenderBreakdown(charDialogue),
    [charDialogue],
  )
  const sceneBreakdown = useMemo(() => computeSceneBreakdown(doc), [doc])
  const pacingData = useMemo(() => computePacingData(doc), [doc])
  const charPresence = useMemo(
    () => computeCharacterPresence(doc, characterProfiles),
    [doc, characterProfiles],
  )
  const timingResult = useMemo(() => computeSceneTiming(doc), [doc])

  const sceneHeadings = useMemo(
    () => pacingData.map((d) => d.heading),
    [pacingData],
  )

  useEffect(() => {
    if (!open || !statisticsScrollTo) return

    const target = statisticsScrollTo
    const t = setTimeout(() => {
      const el = document.getElementById(target)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })

      setStatisticsScrollTo(null)
    }, 50)

    return () => clearTimeout(t)
  }, [open, statisticsScrollTo, setStatisticsScrollTo])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 [&_.recharts-cartesian-axis-tick-value]:fill-(--fd-text-muted)! [&_.recharts-label]:fill-(--fd-text-muted)! [&_.recharts-pie-label-text]:fill-(--fd-text-muted)! [&_.recharts-cartesian-axis-line]:stroke-white/8! [&_.recharts-cartesian-grid-horizontal_line]:stroke-white/8! [&_.recharts-cartesian-grid-vertical_line]:stroke-white/8! [&_.recharts-legend-item-text]:text-[11px]! [&_.recharts-legend-item-text]:text-(--fd-text-muted)! [&_.recharts-pie-label-text]:text-[10px]!">
          <DialogHeader className="px-5 py-3 border-(--fd-border) border-b shrink-0">
            <DialogTitle className="text-[15px] text-(--fd-text)">
              Script Statistics
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[65dvh] max-h-[65dvh]">
            <div className="flex flex-col flex-1 gap-6 p-5">
              <div className="gap-3 grid grid-cols-4 max-[768px]:grid-cols-2">
                <StatCard
                  value={overview.totalPages}
                  label="Pages"
                  sublabel={`Est. ${
                    timingResult.totalSeconds > 0
                      ? formatRuntime(timingResult.totalSeconds)
                      : formatEstimatedTime(overview.estimatedRuntime)
                  }`}
                />
                <StatCard
                  value={overview.totalScenes}
                  label="Scenes"
                  sublabel={`Avg ${overview.averageSceneLength.toFixed(1)} pages`}
                />
                <StatCard
                  value={overview.totalCharacters}
                  label="Characters"
                  sublabel={`${overview.totalDialogueLines} dialogue lines`}
                />
                <StatCard
                  value={overview.totalWords.toLocaleString()}
                  label="Words"
                  sublabel={`${
                    overview.totalPages > 0
                      ? Math.round(overview.totalWords / overview.totalPages)
                      : 0
                  } per page`}
                />
              </div>

              <DialogueDistributionCard data={charDialogue} />
              <GenderAnalysisCard data={genderStats} />
              <SceneBreakdownCard data={sceneBreakdown} />
              <PacingCard data={pacingData} sceneHeadings={sceneHeadings} />
              <CharacterPresenceCard
                data={charPresence}
                pacingData={pacingData}
                sceneHeadings={sceneHeadings}
              />
              <TimingReport timing={timingResult} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ScriptStatisticsDialog
