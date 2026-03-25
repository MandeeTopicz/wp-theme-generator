import { TEMPLATE_CATALOG } from '@wp-theme-gen/shared'

interface Props {
  form: { templateId: string }
  update: (partial: { templateId: string }) => void
}

/* ------------------------------------------------------------------ */
/*  Inline SVG wireframes – one per template id                       */
/* ------------------------------------------------------------------ */

function WireframeStarter() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="260" height="80" rx="4" className="text-text3/20" fill="currentColor" stroke="none" />
      <rect x="10" y="100" width="78" height="70" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
      <rect x="101" y="100" width="78" height="70" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
      <rect x="192" y="100" width="78" height="70" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function WireframeEditorial() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="14" width="200" height="6" rx="2" className="text-text3/20" fill="currentColor" />
      <rect x="60" y="28" width="160" height="5" rx="2" className="text-text3/20" fill="currentColor" />
      <rect x="80" y="41" width="120" height="5" rx="2" className="text-text3/20" fill="currentColor" />
      <rect x="20" y="62" width="240" height="18" rx="3" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
      <rect x="20" y="86" width="240" height="18" rx="3" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
      <rect x="20" y="110" width="240" height="18" rx="3" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
      <rect x="20" y="134" width="240" height="18" rx="3" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
      <rect x="20" y="158" width="240" height="18" rx="3" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function WireframePortfolio() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="260" height="4" rx="2" className="text-text3/20" fill="currentColor" />
      <rect x="10" y="26" width="126" height="144" rx="4" className="text-text3/20" fill="currentColor" />
      <rect x="144" y="26" width="126" height="144" rx="4" className="text-text3/20" fill="currentColor" />
    </svg>
  )
}

function WireframeBold() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="268" height="80" rx="4" className="text-text3/20" fill="currentColor" />
      <rect x="6" y="94" width="82" height="46" rx="4" className="text-text3/20" fill="currentColor" />
      <rect x="99" y="94" width="82" height="46" rx="4" className="text-text3/20" fill="currentColor" />
      <rect x="192" y="94" width="82" height="46" rx="4" className="text-text3/20" fill="currentColor" />
      <rect x="6" y="150" width="268" height="24" rx="4" className="text-text3/20" fill="currentColor" />
    </svg>
  )
}

function WireframeMinimal() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="90" y="24" width="100" height="4" rx="2" className="text-text3/20" fill="currentColor" />
      <rect x="110" y="36" width="60" height="3" rx="1.5" className="text-text3/20" fill="currentColor" />
      <rect x="20" y="62" width="116" height="50" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1" />
      <rect x="144" y="62" width="116" height="50" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1" />
      <rect x="20" y="120" width="116" height="50" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1" />
      <rect x="144" y="120" width="116" height="50" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

function WireframeMagazine() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="160" height="160" rx="4" className="text-text3/20" fill="currentColor" />
      <rect x="180" y="10" width="90" height="75" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
      <rect x="180" y="95" width="90" height="75" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function WireframeStarterPlus() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hero left: text lines */}
      <rect x="14" y="18" width="100" height="5" rx="2" className="text-text3/20" fill="currentColor" />
      <rect x="14" y="30" width="80" height="4" rx="2" className="text-text3/20" fill="currentColor" />
      <rect x="14" y="40" width="90" height="4" rx="2" className="text-text3/20" fill="currentColor" />
      <rect x="14" y="54" width="50" height="14" rx="3" className="text-text3/20" fill="currentColor" />
      {/* Hero right: image placeholder */}
      <rect x="148" y="10" width="122" height="66" rx="4" className="text-text3/20" fill="currentColor" />
      {/* 3 cards below */}
      <rect x="10" y="90" width="80" height="80" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
      <rect x="100" y="90" width="80" height="80" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
      <rect x="190" y="90" width="80" height="80" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function WireframeCreative() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Large text area spanning most of height */}
      <rect x="16" y="10" width="180" height="8" rx="3" className="text-text3/20" fill="currentColor" />
      <rect x="16" y="26" width="220" height="8" rx="3" className="text-text3/20" fill="currentColor" />
      <rect x="16" y="42" width="160" height="8" rx="3" className="text-text3/20" fill="currentColor" />
      <rect x="16" y="58" width="200" height="8" rx="3" className="text-text3/20" fill="currentColor" />
      <rect x="16" y="74" width="140" height="8" rx="3" className="text-text3/20" fill="currentColor" />
      <rect x="16" y="90" width="190" height="8" rx="3" className="text-text3/20" fill="currentColor" />
      {/* Asymmetric layout below: one big + two small stacked */}
      <rect x="10" y="112" width="160" height="60" rx="4" className="text-text3/20" fill="currentColor" />
      <rect x="180" y="112" width="90" height="27" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
      <rect x="180" y="145" width="90" height="27" rx="4" className="text-text3/40" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Wireframe map                                                     */
/* ------------------------------------------------------------------ */

const WIREFRAME_MAP: Record<string, () => JSX.Element> = {
  starter: WireframeStarter,
  editorial: WireframeEditorial,
  portfolio: WireframePortfolio,
  bold: WireframeBold,
  minimal: WireframeMinimal,
  magazine: WireframeMagazine,
  'starter-plus': WireframeStarterPlus,
  creative: WireframeCreative,
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function StepTemplate({ form, update }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-text1 text-sm font-medium mb-2">
          Choose a template
        </label>
        <div className="grid grid-cols-4 gap-3">
          {TEMPLATE_CATALOG.map((tpl) => {
            const selected = form.templateId === tpl.id
            const Wireframe = WIREFRAME_MAP[tpl.id]

            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => update({ templateId: tpl.id })}
                className={`text-left rounded-lg border p-2.5 focus:outline-none transition-all ${
                  selected
                    ? 'ring-2 ring-accent bg-accent/5 border-accent/30'
                    : 'border-border2 bg-bg2 hover:border-text3/30'
                }`}
              >
                {/* SVG wireframe preview */}
                <div className="rounded-md overflow-hidden bg-bg1/40 mb-1.5">
                  {Wireframe ? <Wireframe /> : null}
                </div>

                {/* Template name + category badge */}
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-text1 text-xs font-medium truncate">
                    {tpl.name}
                  </span>
                  <span className="text-[9px] leading-none px-1.5 py-0.5 rounded-full bg-accent/10 text-accent capitalize shrink-0">
                    {tpl.category}
                  </span>
                </div>

                {/* Description */}
                <p className="text-text3 text-[10px] line-clamp-2 leading-snug">{tpl.description}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
