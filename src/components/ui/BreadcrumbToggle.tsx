interface BreadcrumbToggleProps {
  enabled: boolean
  onToggle: () => void
}

const BreadcrumbToggle = ({ enabled, onToggle }: BreadcrumbToggleProps) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Disable trail breadcrumbs' : 'Enable trail breadcrumbs'}
      className={`rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 ${enabled ? 'bg-orange-500 text-white hover:bg-orange-400' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
        }`}
    >
      Trail {enabled ? 'On' : 'Off'}
    </button>
  )
}

export default BreadcrumbToggle

