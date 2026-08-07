interface AddTargetToggleProps {
  active: boolean
  onToggle: () => void
  disabled?: boolean
}

/** Compact pill button showing whether a dictionary is a write target. */
export default function AddTargetToggle({
  active,
  onToggle,
  disabled,
}: AddTargetToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title={
        active
          ? 'Add to Dictionary writes here'
          : 'Click to make this an Add-to-Dictionary target'
      }
      className={`px-2 py-0.75 rounded-full border text-[11px] whitespace-nowrap ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${
        active
          ? 'border-[#2e7dd7] bg-[rgba(46,125,215,0.15)] text-[#2e7dd7]'
          : 'border-border text-muted-foreground'
      }`}
    >
      {active ? '✓ Add here' : 'Add here'}
    </button>
  )
}
