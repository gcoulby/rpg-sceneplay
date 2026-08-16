import { useEffect, useState } from 'react'
import { MenuIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { HeaderPanelToolbar } from './toolbar/header-panel-toolbar'
import type { HeaderMenuBarItem, HeaderMenuBarModel } from '@/types'

interface MobileMenuItemRendererProps {
  item: HeaderMenuBarItem
  onSelect: (item: HeaderMenuBarItem) => void
  depth?: number
}

function MobileMenuItemRenderer({
  item,
  onSelect,
  depth = 0,
}: MobileMenuItemRendererProps) {
  if (item.separator) {
    return <div className="my-1 h-px bg-border" />
  }

  const indent = { paddingLeft: 8 + depth * 14 }

  if (item.items?.length) {
    return (
      <Accordion type="multiple" className="w-full">
        <AccordionItem value={item.label} className="border-none">
          <AccordionTrigger className="py-1.5 text-sm" style={indent}>
            <span className="flex items-center gap-2">
              {item.icon && <item.icon size={14} />} {item.label}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {item.items.map((sub, i) => (
              <MobileMenuItemRenderer
                key={i}
                item={sub}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  }

  return (
    <button
      type="button"
      disabled={item.disabled}
      onClick={() => onSelect(item)}
      style={indent}
      className="flex w-full items-center justify-between gap-2 rounded-sm py-1.5 pr-2 text-left text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
    >
      <span className="flex items-center gap-2">
        {item.icon && <item.icon size={14} />} {item.label}
      </span>
      {item.shortcut && (
        <span className="text-xs text-muted-foreground">{item.shortcut}</span>
      )}
    </button>
  )
}

interface MobileHeaderMenuProps {
  menus: Array<HeaderMenuBarModel>
  runOrConfirm: (item: HeaderMenuBarItem) => void
  onOpenGoToPage: () => void
}

export function MobileHeaderMenu({
  menus,
  runOrConfirm,
  onOpenGoToPage,
}: MobileHeaderMenuProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const handleSelect = (item: HeaderMenuBarItem) => {
    runOrConfirm(item)
    setOpen(false)
  }

  return (
    <div className="flex h-(--toolbar-h)! items-center justify-between border-b px-2 md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <MenuIcon size={18} />
      </Button>
      <span className="text-xs font-medium text-muted-foreground">
        RPG Sceneplay
      </span>
      <div className="size-8" />

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-4/5 max-w-xs flex-col border-r bg-popover text-popover-foreground shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-base font-medium">Menu</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <XIcon size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              <Accordion type="multiple" className="w-full">
                {menus.map((menu, i) => (
                  <AccordionItem key={i} value={menu.title}>
                    <AccordionTrigger className="py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <menu.icon size={14} /> {menu.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {menu.items.map((item, k) => (
                        <MobileMenuItemRenderer
                          key={k}
                          item={item}
                          onSelect={handleSelect}
                          depth={1}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="mt-2 border-t pt-2">
                <p className="px-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Formatting
                </p>
                <HeaderPanelToolbar onOpenGoToPage={onOpenGoToPage} wrap />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
