import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useEditorStore,
  resolveMoresContds,
  DEFAULT_MORES_CONTDS,
} from '@/stores/editorStore'

interface MoresContdsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Common industry presets; "Custom…" reveals a free-text override.
const CONTD_PRESETS = ["(CONT'D)", '(CONTINUED)', "(cont'd)", '(CONT.)']
const MORE_PRESETS = ['(MORE)', '(MORE...)', '(more)']
const CUSTOM = '__custom__'

/**
 * "Mores & Continueds" settings (per-document, like Final Draft). Controls the
 * two independent kinds of dialogue continuation and their marker text:
 *  - character (CONT'D): same character resumes after action, within a scene
 *  - dialogue page break: (MORE) / (CONT'D) when a speech splits across pages
 * The character (CONT'D) never carries across a scene heading — that is a fixed
 * industry rule, so there is no setting for it.
 */
export default function MoresContdsDialog({
  open,
  onOpenChange,
}: MoresContdsDialogProps) {
  const { pageLayout, setPageLayout } = useEditorStore()
  const initial = resolveMoresContds(pageLayout)

  const [characterContd, setCharacterContd] = useState(initial.characterContd)
  const [dialogueBreakContd, setDialogueBreakContd] = useState(
    initial.dialogueBreakContd,
  )
  const [contdText, setContdText] = useState(initial.contdText)
  const [moreText, setMoreText] = useState(initial.moreText)
  // Custom-override mode for each dropdown (on when the value isn't a preset).
  const [contdCustom, setContdCustom] = useState(
    !CONTD_PRESETS.includes(initial.contdText),
  )
  const [moreCustom, setMoreCustom] = useState(
    !MORE_PRESETS.includes(initial.moreText),
  )

  const handleApply = () => {
    setPageLayout({
      ...pageLayout,
      moresContds: {
        characterContd,
        dialogueBreakContd,
        contdText: contdText.trim() || DEFAULT_MORES_CONTDS.contdText,
        moreText: moreText.trim() || DEFAULT_MORES_CONTDS.moreText,
      },
    })
    onOpenChange(false)
  }

  const handleReset = () => {
    setCharacterContd(DEFAULT_MORES_CONTDS.characterContd)
    setDialogueBreakContd(DEFAULT_MORES_CONTDS.dialogueBreakContd)
    setContdText(DEFAULT_MORES_CONTDS.contdText)
    setMoreText(DEFAULT_MORES_CONTDS.moreText)
    setContdCustom(false)
    setMoreCustom(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mores &amp; Continueds</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2.5 mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={characterContd}
                onChange={(e) => setCharacterContd(e.target.checked)}
              />
              <span className="text-sm">
                Automatic character{' '}
                {contdText.trim() || DEFAULT_MORES_CONTDS.contdText}
              </span>
            </label>
            <p className="ml-6.5 text-muted-foreground text-xs">
              Adds the marker when a character speaks again after an action line
              within the same scene. It is never added across a scene heading.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2.5 mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={dialogueBreakContd}
                onChange={(e) => setDialogueBreakContd(e.target.checked)}
              />
              <span className="text-sm">
                Show {moreText.trim() || DEFAULT_MORES_CONTDS.moreText} /{' '}
                {contdText.trim() || DEFAULT_MORES_CONTDS.contdText} when
                dialogue breaks across pages
              </span>
            </label>
            <p className="ml-6.5 text-muted-foreground text-xs">
              When a single speech splits over a page break, shows{' '}
              {moreText.trim() || DEFAULT_MORES_CONTDS.moreText} at the bottom
              of the page and the character name with{' '}
              {contdText.trim() || DEFAULT_MORES_CONTDS.contdText} at the top of
              the next.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
              Continued text
            </Label>
            <Select
              value={contdCustom ? CUSTOM : contdText}
              onValueChange={(value) => {
                if (!value) return
                if (value === CUSTOM) setContdCustom(true)
                else {
                  setContdCustom(false)
                  setContdText(value)
                }
              }}
            >
              <SelectTrigger className="w-full h-7.5 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTD_PRESETS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM}>Custom…</SelectItem>
              </SelectContent>
            </Select>
            {contdCustom && (
              <Input
                className="h-7.5 text-xs"
                value={contdText}
                onChange={(e) => setContdText(e.target.value)}
                placeholder="(CONT'D)"
                autoFocus
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
              More text
            </Label>
            <Select
              value={moreCustom ? CUSTOM : moreText}
              onValueChange={(value) => {
                if (!value) return
                if (value === CUSTOM) setMoreCustom(true)
                else {
                  setMoreCustom(false)
                  setMoreText(value)
                }
              }}
            >
              <SelectTrigger className="w-full h-7.5 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MORE_PRESETS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM}>Custom…</SelectItem>
              </SelectContent>
            </Select>
            {moreCustom && (
              <Input
                className="h-7.5 text-xs"
                value={moreText}
                onChange={(e) => setMoreText(e.target.value)}
                placeholder="(MORE)"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            className="mr-auto cursor-pointer"
            onClick={handleReset}
          >
            Reset to defaults
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button className="cursor-pointer" onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
