import { useMemo, useState } from 'react'
import { DayPicker, DayButton, useNavigation, CaptionLabel} from 'react-day-picker'

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

function MonthCaptionInline(props: any) {
  const { goToMonth, previousMonth, nextMonth } = useNavigation(); // navigation DayPicker
  return (
    <div className="flex items-center justify-start gap-2 pl-15">
      <button
        type="button"
        className="btn btn-ghost btn-xs p-1"
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        aria-label="Mois précédent"
      >
        <span className="text-white">{'<'}</span>
      </button>

      <span className="text-sm">
        <CaptionLabel {...props} />
      </span>

      <button
        type="button"
        className="btn btn-ghost btn-xs p-1"
        disabled={!nextMonth}
        onClick={() => nextMonth && goToMonth(nextMonth)}
        aria-label="Mois suivant"
      >
        <span className="text-white">{'>'}</span>
      </button>
    </div>
  );
}

const PHASES = [
    { name: 'New Moon', emoji: '🌑' },
    { name: 'Waxing Crescent', emoji: '🌒' },
    { name: 'First Quarter', emoji: '🌓' },
    { name: 'Waxing Gibbous', emoji: '🌔' },
    { name: 'Full Moon', emoji: '🌕' },
    { name: 'Waning Gibbous', emoji: '🌖' },
    { name: 'Last Quarter', emoji: '🌗' },
    { name: 'Waning Crescent', emoji: '🌘' },
] as const

function DayButtonWithMoon(props: any) {
    const date: Date = props.day.date
    const idx = getMoonPhaseIndex(date)
    const emoji = PHASES[idx].emoji
    return (
        <DayButton {...props}>
            <div className="flex items-start justify-between w-full">
                <span className="text-xs font-medium">{date.getDate()}</span>
                <span className="text-base leading-none">{emoji}</span>
            </div>
        </DayButton>
    )
}

export default function LunarCalendarWithSide() {
    const [selected, setSelected] = useState<Date>(new Date())
    const info = useMemo(() => {
        const idx = getMoonPhaseIndex(selected)
        return {
            label: selected.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            phase: PHASES[idx],
        }
    }, [selected])

    return (
        <div className="flex items-start justify-center gap-4">
            <div className="card bg-base-100 shadow-sm w-full max-w-md">
                <div className="card-body p-3">
                    <DayPicker
                        mode="single"
                        selected={selected}
                        onSelect={(d) => d && setSelected(d)}
                        components={{
                            DayButton: DayButtonWithMoon as any,
                            MonthCaption: MonthCaptionInline as any
                        }}
                        captionLayout="label"
                        hideNavigation
                        navLayout="around"
                        classNames={{
                            caption: 'flex justify-start',
                            caption_label: 'text-center',
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
