import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEditorStore } from '@/stores/editorStore'
import type { RuleSection } from '@/types'

export function RuleList({ section }: { section: RuleSection }) {
  const grammarRulesEnabled = useEditorStore((s) => s.grammarRulesEnabled)
  const setGrammarRuleEnabled = useEditorStore((s) => s.setGrammarRuleEnabled)
  const isOn = (id: string) => grammarRulesEnabled[id] !== false

  return (
    <ScrollArea className="rounded-md w-full h-[65vh]">
      <p className="text-muted-foreground text-xs">{section.blurb}</p>
      <div className="space-y-1.5">
        {section.ids.map((id) => {
          const meta = section.meta[id]
          if (!meta) return null
          return (
            <Label
              key={id}
              className="flex items-start gap-2.5 p-2 cursor-pointer"
            >
              <Input
                type="checkbox"
                className="w-4 cursor-pointer"
                checked={isOn(id)}
                onChange={(e) => setGrammarRuleEnabled(id, e.target.checked)}
              />
              <div className="flex-1">
                <div className="font-medium text-[13px]">{meta.label}</div>
                <div className="text-muted-foreground text-xs">
                  {meta.description}
                </div>
              </div>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded shrink-0 ${
                  meta.severity === 'grammar'
                    ? 'bg-[rgba(26,168,136,0.15)] text-[#1aa888]'
                    : 'bg-[rgba(46,125,215,0.15)] text-[#2e7dd7]'
                }`}
              >
                {meta.severity}
              </span>
            </Label>
          )
        })}
      </div>
    </ScrollArea>
  )
}
