// src/components/LunarCalendarWithSide.tsx
import { useMemo, useState } from 'react'
import {
  DayPicker,
  DayButton,
  useNavigation,
  CaptionLabel,
} from 'react-day-picker'
import 'react-day-picker/style.css'

function getMoonPhaseIndex(d: Date): number {
  let y = d.getFullYear()
  let m = d.getMonth() + 1
  const day = d.getDate()
  if (m < 3) { y--; m += 12 }
  m++
  let c = 365.25 * y
  let e = 30.6 * m
  let jd = c + e + day - 694_039.09
  jd /= 29.5305882
  let b = parseInt(String(jd), 10)
  jd -= b
  b = Math.round(jd * 8)
  if (b >= 8) b = 0
  return b
}

const PHASES = [
  { name: 'New Moon', emoji: '🌑' },
  { name: 'Waxing Crescent', emoji: '🌒' },
  { name: 'First Quarter', emoji: '🌓' },
  { name: 'Waxing Gibbous', emoji: '🌔' },
  { name: 'Full Moon', emoji: '🌕' },
  { name: 'Waning Gibbous', emoji: '🌖' },
  { name: 'Third Quarter', emoji: '🌗' },
  { name: 'Waning Crescent', emoji: '🌘' },
] as const

function MonthCaptionInline(props: any) {
  const { goToMonth, previousMonth, nextMonth } = useNavigation()
  const today = new Date()

  const goToday = () => {
    goToMonth(today)
  }

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-xs p-1"
          disabled={!previousMonth}
          onClick={() => previousMonth && goToMonth(previousMonth)}
          aria-label="Previous month"
        >
          <span className="text-white">{'<'}</span>
        </button>

        <span className="text-sm leading-none">
          <CaptionLabel {...props} />
        </span>

        <button
          type="button"
          className="btn btn-ghost btn-xs p-1"
          disabled={!nextMonth}
          onClick={() => nextMonth && goToMonth(nextMonth)}
          aria-label="Next month"
        >
          <span className="text-white">{'>'}</span>
        </button>
      </div>

      <button
        type="button"
        className="btn btn-ghost btn-xs"
        onClick={goToday}
        aria-label="Go to today"
      >
        Today
      </button>
    </div>
  )
}

export default function LunarCalendarWithSide() {
  const [selected, setSelected] = useState<Date>(new Date())
  const [showPhase, setShowPhase] = useState(false) // false: days, true: phases

  const info = useMemo(() => {
    const idx = getMoonPhaseIndex(selected)
    return {
      label: selected.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      phase: PHASES[idx],
    }
  }, [selected])

  // Rendu dynamique d'une case du calendrier
  const DayButtonDynamic = (props: any) => {
    const date: Date = props.day.date
    if (showPhase) {
      const idx = getMoonPhaseIndex(date)
      const phase = PHASES[idx]
      return (
        <DayButton
          {...props}
          title={`${phase.name} – ${date.toLocaleDateString('en-US')}`}
        >
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xl leading-none">{phase.emoji}</span>
          </div>
        </DayButton>
      )
    }
    return (
      <DayButton {...props} title={date.toLocaleDateString('en-US')}>
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-sm font-medium leading-none">{date.getDate()}</span>
        </div>
      </DayButton>
    )
  }

  return (
    <div className="flex items-start justify-center gap-4">
      <div className="card bg-base-100 shadow-sm w-full max-w-md">
        <div className="card-body p-3">
          {/* Toggle daisyUI Days <-> Phases avec contenu dans le rail */}
          <label className="flex items-center justify-end gap-2 mb-2">
            <span className="text-xs opacity-70">Days</span>

            <label className="relative inline-block">
              <input
                type="checkbox"
                className="toggle toggle-primary peer"
                checked={showPhase}
                onChange={(e) => setShowPhase(e.target.checked)}
                aria-label="Toggle display of days/phases"
              />
            </label>

            <span className="text-xs opacity-70">Phases</span>
          </label>

          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => d && setSelected(d)}
            components={{
              DayButton: DayButtonDynamic as any,
              MonthCaption: MonthCaptionInline as any,
            }}
            captionLayout="label"
            hideNavigation
            classNames={{
              caption: 'flex items-center', // le caption custom gère déjà la largeur
              day: 'outline-none focus:outline-none focus:ring-0',
              day_selected: 'bg-transparent text-inherit',
            }}
            styles={{
              day: { outline: 'none', justifyContent: 'center', alignItems: 'center' },
              day_selected: { background: 'transparent', boxShadow: 'none' },
            }}
          />
        </div>
      </div>

      <aside className="card bg-base-100 shadow-sm w-56">
        <div className="card-body p-3 items-center text-center">
          <div className="text-sm opacity-70">Date</div>
          <div className="text-base font-medium">{info.label}</div>
          <div className="divider my-2"></div>
          <div className="text-sm opacity-70">Phase</div>
          <div className="flex items-center gap-2 text-base">
            <span>{info.phase.emoji}</span>
            <span>{info.phase.name}</span>
          </div>
        </div>
      </aside>
    </div>
  )
}
