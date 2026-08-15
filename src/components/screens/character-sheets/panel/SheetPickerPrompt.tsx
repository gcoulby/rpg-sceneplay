import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SHEET_TEMPLATES } from '../templates'
import { DEFAULT_TEMPLATE_ICON, TEMPLATE_ICONS } from '../templates/templateIcons'
import type { SheetTemplate } from '../types'

interface SheetPickerPromptProps {
  characterName: string
  onStartFromTemplate: (template: SheetTemplate) => void
  onStartBlank: () => void
}

/** First-open prompt: character has no linked sheet yet. Building the Sheet
 *  record happens only from here — never silently on open. */
const SheetPickerPrompt: React.FC<SheetPickerPromptProps> = ({
  characterName,
  onStartFromTemplate,
  onStartBlank,
}) => (
  <div className="flex flex-col items-center gap-4 mx-auto py-12 max-w-2xl">
    <h2 className="font-semibold text-sm">
      {characterName} doesn't have a character sheet yet
    </h2>
    <p className="text-(--fd-text-muted) text-xs text-center">
      Start from a premade template, or build one from scratch.
    </p>

    <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 w-full">
      {SHEET_TEMPLATES.map((template) => {
        const Icon = TEMPLATE_ICONS[template.id] ?? DEFAULT_TEMPLATE_ICON
        return (
          <Card
            key={template.id}
            className="group hover:bg-(--fd-dropdown-bg) cursor-pointer transition-colors"
            onClick={() => onStartFromTemplate(template)}
          >
            <CardHeader className="flex flex-row items-center gap-2.5 pb-2">
              <div className="flex justify-center items-center bg-(--fd-accent)/15 rounded-md size-8 text-(--fd-accent) shrink-0">
                <Icon className="size-4" />
              </div>
              <CardTitle className="text-xs">{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              <p className="text-[11px] text-(--fd-text-muted) leading-relaxed">
                {template.description}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="group-hover:border-(--fd-accent) text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onStartFromTemplate(template)
                }}
              >
                Use this template
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>

    <Button variant="ghost" size="sm" className="text-xs" onClick={onStartBlank}>
      Start from a blank sheet
    </Button>
  </div>
)

export default SheetPickerPrompt
