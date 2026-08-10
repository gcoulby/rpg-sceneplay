import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AddCategoryFormProps {
  isOpen: boolean
  name: string
  color: string
  onNameChange: (v: string) => void
  onColorChange: (v: string) => void
  onOpen: () => void
  onSubmit: () => void
  onCancel: () => void
}

const AddCategoryForm: React.FC<AddCategoryFormProps> = ({
  isOpen,
  name,
  color,
  onNameChange,
  onColorChange,
  onOpen,
  onSubmit,
  onCancel,
}) => {
  if (!isOpen) {
    return (
      <button
        className="mx-3 mt-2 mb-3 p-2 bg-transparent border border-dashed border-(--fd-border) rounded text-(--fd-text-muted) text-xs cursor-pointer shrink-0 text-center hover:border-(--fd-accent) hover:text-(--fd-accent)"
        onClick={onOpen}
      >
        + Add Category
      </button>
    )
  }

  return (
    <div className="flex gap-1 px-3 py-2 border-t border-(--fd-border) shrink-0">
      <Input
        type="text"
        className="flex-1 h-6.5 text-[11px]"
        placeholder="Category name..."
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        autoFocus
        aria-label="New category name"
      />
      <Input
        type="color"
        className="p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:border-white/15 [&::-webkit-color-swatch]:rounded-[3px] w-6.5 h-6.5 cursor-pointer"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        aria-label="New category color"
      />
      <Button
        variant="outline"
        size="sm"
        className="h-6.5 px-2 text-[11px] text-(--fd-accent) border-(--fd-accent)"
        onClick={onSubmit}
      >
        Add
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="px-2 h-6.5 text-[11px]"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  )
}

export default AddCategoryForm
