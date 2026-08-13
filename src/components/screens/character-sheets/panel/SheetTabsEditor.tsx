import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { uuid } from '@/utils/open-draft/uuid'
import type { CharacterSheet, ModuleType, SheetTab } from '../types'
import { MODULE_REGISTRY, MODULE_TYPES } from '../modules/moduleRegistry'
import { buildValueMap } from '../formula/buildValueMap'

interface SheetTabsEditorProps {
  sheet: CharacterSheet
  onChangeLayout: (tabs: SheetTab[]) => void
}

const SheetTabsEditor: React.FC<SheetTabsEditorProps> = ({ sheet, onChangeLayout }) => {
  const tabs = sheet.moduleLayout.tabs
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '')
  const valueMap = buildValueMap(sheet)

  const currentActive = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0]?.id ?? ''

  const addTab = () => {
    const tab: SheetTab = { id: uuid(), label: 'New Tab', modules: [] }
    onChangeLayout([...tabs, tab])
    setActiveTab(tab.id)
  }

  const removeTab = (tabId: string) => {
    onChangeLayout(tabs.filter((t) => t.id !== tabId))
  }

  const renameTab = (tabId: string, label: string) => {
    onChangeLayout(tabs.map((t) => (t.id === tabId ? { ...t, label } : t)))
  }

  const addModule = (tabId: string, type: ModuleType) => {
    const def = MODULE_REGISTRY[type]
    const values = structuredClone(def.defaultValues) as Record<string, unknown>
    if (type === 'core-block' && sheet.characterName) {
      values.characterName = sheet.characterName
    }
    onChangeLayout(
      tabs.map((t) =>
        t.id === tabId
          ? {
              ...t,
              modules: [
                ...t.modules,
                {
                  id: uuid(),
                  type,
                  label: def.label,
                  config: structuredClone(def.defaultConfig),
                  values,
                },
              ],
            }
          : t,
      ),
    )
  }

  if (tabs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-(--fd-text-muted)">
        <p className="text-sm">This sheet has no tabs yet.</p>
        <Button variant="outline" size="sm" onClick={addTab}>
          <Plus className="mr-1 size-3.5" />
          Add Tab
        </Button>
      </div>
    )
  }

  return (
    <Tabs value={currentActive} onValueChange={setActiveTab} className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button variant="ghost" size="icon" className="size-7" onClick={addTab} title="Add tab">
          <Plus className="size-4" />
        </Button>
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              value={tab.label}
              onChange={(e) => renameTab(tab.id, e.target.value)}
              className="bg-transparent px-1 border-0 border-(--fd-border) border-b outline-none text-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 text-xs')}
              >
                <Plus className="mr-1 size-3.5" />
                Add Module
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {MODULE_TYPES.map((type) => (
                  <DropdownMenuItem key={type} onClick={() => addModule(tab.id, type)}>
                    {MODULE_REGISTRY[type].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-(--fd-text-muted) ml-auto"
              onClick={() => removeTab(tab.id)}
              title="Remove tab"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="gap-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {tab.modules.map((mod) => {
              const def = MODULE_REGISTRY[mod.type]
              const Component = def.Component
              return (
                <Component
                  key={mod.id}
                  module={mod}
                  valueMap={valueMap}
                  onChangeLabel={(label) =>
                    onChangeLayout(
                      tabs.map((t) =>
                        t.id === tab.id
                          ? {
                              ...t,
                              modules: t.modules.map((m) =>
                                m.id === mod.id ? { ...m, label } : m,
                              ),
                            }
                          : t,
                      ),
                    )
                  }
                  onChangeConfig={(config) =>
                    onChangeLayout(
                      tabs.map((t) =>
                        t.id === tab.id
                          ? {
                              ...t,
                              modules: t.modules.map((m) =>
                                m.id === mod.id ? { ...m, config } : m,
                              ),
                            }
                          : t,
                      ),
                    )
                  }
                  onChangeValues={(values) =>
                    onChangeLayout(
                      tabs.map((t) =>
                        t.id === tab.id
                          ? {
                              ...t,
                              modules: t.modules.map((m) =>
                                m.id === mod.id ? { ...m, values } : m,
                              ),
                            }
                          : t,
                      ),
                    )
                  }
                  onDelete={() =>
                    onChangeLayout(
                      tabs.map((t) =>
                        t.id === tab.id
                          ? { ...t, modules: t.modules.filter((m) => m.id !== mod.id) }
                          : t,
                      ),
                    )
                  }
                />
              )
            })}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default SheetTabsEditor
