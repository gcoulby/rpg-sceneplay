import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { uuid } from '@/utils/open-draft/uuid'
import type { CharacterSheet, ModuleType, SheetModule, SheetTab } from '../types'
import { MODULE_REGISTRY, MODULE_TYPES } from '../modules/moduleRegistry'
import { getModuleLayout } from '../modules/shared/getModuleLayout'
import { ADD_TILE_CLASSNAME } from '../modules/shared/AddTile'
import { buildValueMap } from '../formula/buildValueMap'

interface SheetTabsEditorProps {
  sheet: CharacterSheet
  onChangeLayout: (tabs: SheetTab[]) => void
}

const SheetTabsEditor: React.FC<SheetTabsEditorProps> = ({ sheet, onChangeLayout }) => {
  const tabs = sheet.moduleLayout.tabs
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '')
  const [tabPendingDelete, setTabPendingDelete] = useState<SheetTab | null>(null)
  const valueMap = buildValueMap(sheet)

  const currentActive = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0]?.id ?? ''

  const updateModules = (tabId: string, modules: SheetModule[]) =>
    onChangeLayout(tabs.map((t) => (t.id === tabId ? { ...t, modules } : t)))

  const addTab = () => {
    const tab: SheetTab = { id: uuid(), label: 'New Tab', modules: [] }
    onChangeLayout([...tabs, tab])
    setActiveTab(tab.id)
  }

  const confirmRemoveTab = () => {
    if (!tabPendingDelete) return
    const remaining = tabs.filter((t) => t.id !== tabPendingDelete.id)
    onChangeLayout(remaining)
    if (activeTab === tabPendingDelete.id) setActiveTab(remaining[0]?.id ?? '')
    setTabPendingDelete(null)
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
    const tab = tabs.find((t) => t.id === tabId)
    if (!tab) return
    updateModules(tabId, [
      ...tab.modules,
      {
        id: uuid(),
        type,
        label: def.label,
        config: structuredClone(def.defaultConfig),
        values,
        layout: { ...def.defaultLayout },
      },
    ])
  }

  const moveModule = (tabId: string, index: number, direction: -1 | 1) => {
    const tab = tabs.find((t) => t.id === tabId)
    if (!tab) return
    const target = index + direction
    if (target < 0 || target >= tab.modules.length) return
    const modules = [...tab.modules]
    ;[modules[index], modules[target]] = [modules[target], modules[index]]
    updateModules(tabId, modules)
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
      <div className="flex items-center gap-2 mb-4">
        <TabsList className="max-w-full overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="shrink-0">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={addTab} title="Add tab">
          <Plus className="size-4" />
        </Button>
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="flex flex-col gap-4">
          <div className="flex items-center gap-3 bg-black/10 px-3 py-2 border border-(--fd-border) rounded-md">
            <div className="flex flex-col gap-0.5">
              <span className="text-(--fd-text-muted) text-[10px] uppercase tracking-wide">
                Tab name
              </span>
              <input
                value={tab.label}
                onChange={(e) => renameTab(tab.id, e.target.value)}
                className="bg-transparent px-1.5 -mx-1.5 border border-(--fd-border) hover:border-(--fd-text-muted) focus-visible:border-ring rounded outline-none font-medium text-sm h-7"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="disabled:opacity-30 ml-auto text-(--fd-text-muted) hover:text-destructive size-7"
              onClick={() => setTabPendingDelete(tab)}
              disabled={tabs.length <= 1}
              title={tabs.length <= 1 ? "Sheet needs at least one tab" : 'Delete tab'}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          {tab.modules.length === 0 ? (
            <p className="py-8 text-(--fd-text-muted) text-xs text-center">
              No modules on this tab yet — use the tile below to add one.
            </p>
          ) : null}

          <div
            className="items-start gap-3 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6"
            style={{
              gridAutoFlow: 'dense',
              gridAutoRows: 'minmax(48px, auto)',
            }}
          >
            {tab.modules.map((mod, index) => {
              const def = MODULE_REGISTRY[mod.type]
              const Component = def.Component
              const layout = getModuleLayout(mod)
              return (
                <div
                  key={mod.id}
                  style={{
                    gridColumn: `span ${layout.w}`,
                    gridRow: `span ${layout.h}`,
                  }}
                >
                  <Component
                    module={mod}
                    valueMap={valueMap}
                    layout={layout}
                    onChangeLabel={(label) =>
                      updateModules(
                        tab.id,
                        tab.modules.map((m) => (m.id === mod.id ? { ...m, label } : m)),
                      )
                    }
                    onChangeConfig={(config) =>
                      updateModules(
                        tab.id,
                        tab.modules.map((m) => (m.id === mod.id ? { ...m, config } : m)),
                      )
                    }
                    onChangeValues={(values) =>
                      updateModules(
                        tab.id,
                        tab.modules.map((m) => (m.id === mod.id ? { ...m, values } : m)),
                      )
                    }
                    onChangeLayout={(nextLayout) =>
                      updateModules(
                        tab.id,
                        tab.modules.map((m) => (m.id === mod.id ? { ...m, layout: nextLayout } : m)),
                      )
                    }
                    onDelete={() =>
                      updateModules(
                        tab.id,
                        tab.modules.filter((m) => m.id !== mod.id),
                      )
                    }
                    onMoveUp={index > 0 ? () => moveModule(tab.id, index, -1) : null}
                    onMoveDown={
                      index < tab.modules.length - 1
                        ? () => moveModule(tab.id, index, 1)
                        : null
                    }
                  />
                </div>
              )
            })}

            <div style={{ gridColumn: 'span 2', gridRow: 'span 2' }}>
              <DropdownMenu>
                <DropdownMenuTrigger className={cn(ADD_TILE_CLASSNAME, 'h-full')}>
                  Add Module
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {MODULE_TYPES.map((type) => {
                    const Icon = MODULE_REGISTRY[type].icon
                    return (
                      <DropdownMenuItem key={type} onClick={() => addModule(tab.id, type)}>
                        <Icon className="mr-1.5 size-3.5 text-(--fd-text-muted)" />
                        {MODULE_REGISTRY[type].label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </TabsContent>
      ))}

      <AlertDialog open={tabPendingDelete !== null} onOpenChange={(open) => !open && setTabPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{tabPendingDelete?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the tab and every module on it ({tabPendingDelete?.modules.length ?? 0}{' '}
              module{tabPendingDelete?.modules.length === 1 ? '' : 's'}). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveTab}>Delete Tab</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}

export default SheetTabsEditor
