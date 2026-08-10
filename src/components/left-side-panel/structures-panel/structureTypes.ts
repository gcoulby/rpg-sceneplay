import type { ScriptStructure } from '@/utils/open-draft/scriptStructure'

export type ScriptAct = ScriptStructure['acts'][number]
export type ScriptSequence = ScriptAct['sequences'][number]
export type ScriptStructureScene = ScriptSequence['scenes'][number]
