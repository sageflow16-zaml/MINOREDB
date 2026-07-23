import { cn } from '../../lib/utils';

interface CalendarHeatmapProps {
  data: Record<string, number>;
  minDate?: string | null;
  maxDate?: string | null;
  className?: string;
  onDayClick?: (date: string, pnl: number) => void;
  showTooltip?: boolean;
  colorScheme?: 'pnl' | 'trades';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getColorForPnl(pnl: number): string {
  if (pnl > 0) return 'var(--success)';
  if (pnl < 0) return 'var(--destructive)';
  return 'var(--muted)';
}

function getIntensity(pnl: number, maxAbs: number): number {
  if (maxAbs === 0) return 0;
  return Math.min(Math.abs(pnl) / maxAbs, 1);
}

export function CalendarHeatmap({
  data,
  minDate,
  maxDate,
  className,
  onDayClick,
  showTooltip = true,
  colorScheme = 'pnl',
}: CalendarHeatmapProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No data available for calendar heatmap
      </div>
    );
  }

  const dates = Object.keys(data).map(k => new Date(k + 'T00:00:00'));
  const actualMin = minDate ? new Date(minDate + 'T00:00:00') : new Date(Math.min(...dates.map(d => d.getTime())));
  const actualMax = maxDate ? new Date(maxDate + 'T00:00:00') : new Date(Math.max(...dates.map(d => d.getTime())));

  const maxAbsPnl = Math.max(...Object.values(data).map(Math.abs), 1);

  // Generate weeks
  const weeks: { date: Date; pnl: number; isCurrentMonth: boolean; isInRange: boolean }[][] = [];
  let current = new Date(actualMin);
  current.setDate(current.getDate() - current.getDay()); // Start of week (Sunday)

  while (current <= actualMax) {
    const week: { date: Date; pnl: number; isCurrentMonth: boolean; isInRange: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(current);
      day.setDate(current.getDate() + i);
      const key = day.toISOString().split('T')[0];
      const pnl = data[key] ?? 0;
      week.push({
        date: day,
        pnl,
        isCurrentMonth: day >= actualMin && day <= actualMax,
        isInRange: day >= actualMin && day <= actualMax,
      });
    }
    weeks.push(week);
    current.setDate(current.getDate() + 7);
  }

  return (
    <div className={cn('font-mono', className)}>
      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className="text-[10px] text-center text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex gap-0.5">
            {week.map((day, dIdx) => {
              const intensity = getIntensity(day.pnl, maxAbsPnl);
              const color = getColorForPnl(day.pnl);
              const bgOpacity = day.pnl === 0 ? 0 : 0.15 + intensity * 0.6;
              
              return (
                <button
                  key={`${wIdx}-${dIdx}`}
                  onClick={() => onDayClick?.(day.date.toISOString().split('T')[0], day.pnl)}
                  disabled={!day.isInRange}
                  className={cn(
                    'relative w-7 h-7 rounded transition-all duration-150',
                    day.isInRange ? 'hover:scale-110 hover:shadow-md cursor-pointer' : 'cursor-default opacity-30',
                    !day.isCurrentMonth && 'opacity-20'
                  )}
                  style={{
                    backgroundColor: day.pnl === 0 ? 'transparent' : color,
                    opacity: day.pnl === 0 ? 1 : bgOpacity,
                  }}
                  title={showTooltip ? `${day.date.toLocaleDateString()}: ${day.pnl >= 0 ? '+' : ''}${day.pnl.toFixed(2)}` : undefined}
                >
                  <span className={cn(
                    'absolute inset-0 flex items-center justify-center text-[9px] font-medium',
                    day.pnl > 0 ? 'text-success' : day.pnl < 0 ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {day.date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="flex items-center gap-1">
          <div className="w-6 h-3 rounded bg-gradient-to-r from-destructive via-muted to-success" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

interface CalendarHeatmapYearProps {
  data: Record<string, number>;
  year?: number;
  className?: string;
}

export function CalendarHeatmapYear({ data, year = new Date().getFullYear(), className }: CalendarHeatmapYearProps) {
  const months: React.ReactNode[] = [];
  
  for (let month = 0; month < 12; month++) {
    const monthData: Record<string, number> = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (data[key] !== undefined) {
        monthData[key] = data[key];
      }
    }
    
    months.push(
      <div key={month} className="flex flex-col items-center">
        <div className="text-xs font-medium text-muted-foreground mb-1 w-full text-left">
          {MONTHS[month]}
        </div>
        <CalendarHeatmap data={monthData} />
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-4 gap-4', className)}>
      {months}
    </div>
  );
}