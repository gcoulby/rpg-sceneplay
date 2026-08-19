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
    return <div className="my-1 bg-border h-px" />
  }

  const indent = { paddingLeft: 8 + depth * 14 }

  if (item.items?.length) {
    return (
      <Accordion multiple className="w-full">
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
      className="flex justify-between items-center gap-2 hover:bg-accent disabled:opacity-40 py-1.5 pr-2 rounded-sm w-full text-sm text-left disabled:pointer-events-none"
    >
      <span className="flex items-center gap-2">
        {item.icon && <item.icon size={14} />} {item.label}
      </span>
      {item.shortcut && (
        <span className="text-muted-foreground text-xs">{item.shortcut}</span>
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
      <span className="font-medium text-muted-foreground text-xs">
        RPG Sceneplay
      </span>
      <div className="size-8" />

      {open && (
        <div className="md:hidden z-50 fixed inset-0">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="left-0 absolute inset-y-0 flex flex-col bg-popover shadow-lg border-r w-4/5 max-w-xs text-popover-foreground">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <span className="font-medium text-base">Menu</span>
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
            <div className="flex-1 px-2 py-2 overflow-y-auto">
              <Accordion multiple className="w-full">
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

              <div className="mt-2 pt-2 border-t">
                <p className="px-2 pb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
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
