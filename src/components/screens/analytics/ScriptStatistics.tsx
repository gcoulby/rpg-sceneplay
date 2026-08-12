import React, { useEffect, useMemo } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorStore } from '@/stores/editorStore'
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
import TimingReport from './TimingReport'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  editor: Editor
}

const ScriptStatistics: React.FC<Props> = ({ editor }) => {
  const {
    characterProfiles,
    pageCount,
    statisticsScrollTo,
    setStatisticsScrollTo,
  } = useEditorStore()

  const doc = editor.getJSON()

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
  }, [statisticsScrollTo, setStatisticsScrollTo])

  return (
    <>
      <ScrollArea className="h-(--app-h)">
        <div className="flex items-start py-2.5 px-4 border-b border-(--fd-border) bg-(--fd-navigator-bg) shrink-0 gap-10">
          <span className="font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
            Script Statistics
          </span>
          <span className="text-[11px] text-(--fd-text-muted)">
            {overview.totalPages} pages
          </span>

          <span className="text-[11px] text-(--fd-text-muted)">
            {(timingResult.totalSeconds / 60).toFixed()}m runtime
          </span>
        </div>
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
    </>
  )
}

export default ScriptStatistics
