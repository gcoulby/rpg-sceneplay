import React from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import MiniRichText from './MiniRichText'

type VoiceField =
  | 'speechPattern'
  | 'vocabulary'
  | 'verbalTics'
  | 'sampleDialogue'

interface CharacterVoiceProfileSectionProps {
  speechPattern: string
  vocabulary: string
  verbalTics: string
  sampleDialogue: string
  onChange: (field: VoiceField, html: string) => void
}

const FIELD_LABEL =
  'text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block'

const CharacterVoiceProfileSection: React.FC<
  CharacterVoiceProfileSectionProps
> = ({ speechPattern, vocabulary, verbalTics, sampleDialogue, onChange }) => (
  <Collapsible className="my-1">
    <CollapsibleTrigger
      className={`${FIELD_LABEL} cursor-pointer select-none hover:bg-accent-foreground hover:text-accent bg-foreground text-background p-2 rounded`}
    >
      Voice Profile
    </CollapsibleTrigger>
    <CollapsibleContent className="pt-1">
      <label className={FIELD_LABEL}>Speech Pattern</label>
      <MiniRichText
        value={speechPattern}
        onChange={(html) => onChange('speechPattern', html)}
        placeholder="Short sentences, formal tone, uses contractions..."
        minHeight={40}
      />
      <label className={FIELD_LABEL}>Vocabulary</label>
      <MiniRichText
        value={vocabulary}
        onChange={(html) => onChange('vocabulary', html)}
        placeholder="Educated, uses legal terms, street slang..."
        minHeight={40}
      />
      <label className={FIELD_LABEL}>Verbal Tics</label>
      <MiniRichText
        value={verbalTics}
        onChange={(html) => onChange('verbalTics', html)}
        placeholder="Says 'you see' often, clears throat before lying..."
        minHeight={40}
      />
      <label className={FIELD_LABEL}>Sample Dialogue</label>
      <MiniRichText
        value={sampleDialogue}
        onChange={(html) => onChange('sampleDialogue', html)}
        placeholder="3-5 representative lines from the script..."
        minHeight={40}
      />
    </CollapsibleContent>
  </Collapsible>
)

export default CharacterVoiceProfileSection
