import { ReactNode } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { cn } from '../../lib/utils';

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

import { chartTooltipStyle } from '../../lib/chart';

const defaultTooltipStyle = chartTooltipStyle.contentStyle;

interface BaseChartProps {
  data: any[];
  height?: number;
  className?: string;
}

interface ChartCardProps {
  title?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

function ChartCard({ title, icon, badge, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      {(title || icon) && (
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          {badge}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export interface AreaChartCardProps extends BaseChartProps {
  dataKey: string;
  xKey?: string;
  color?: string;
  gradient?: boolean;
  gradientColor?: string;
  showGrid?: boolean;
  tickFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any) => [string, string];
}

export function AreaChartCard({
  data, dataKey, xKey = 'name', height = 256,
  color = 'hsl(var(--chart-1))', gradient = true, gradientColor,
  showGrid = false, tickFormatter, tooltipFormatter,
  className,
}: AreaChartCardProps) {
  const gradId = `areaGrad_${dataKey.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const fillColor = gradientColor || color;
  return (
    <div className={cn('h-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          {gradient && (
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />}
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
          <Tooltip contentStyle={defaultTooltipStyle} formatter={tooltipFormatter as any} />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={gradient ? `url(#${gradId})` : 'transparent'} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface BarChartCardProps extends BaseChartProps {
  dataKey?: string;
  xKey?: string;
  color?: string;
  showGrid?: boolean;
  maxBarSize?: number;
  radius?: [number, number, number, number];
  tickFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any, name?: any) => [string, string];
}

export function BarChartCard({
  data, dataKey = 'value', xKey = 'name', height = 256,
  color = 'hsl(var(--primary))',
  showGrid = true, maxBarSize = 48, radius = [4, 4, 0, 0],
  tickFormatter, tooltipFormatter,
  className,
}: BarChartCardProps) {
  return (
    <div className={cn('h-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />}
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
          <Tooltip contentStyle={defaultTooltipStyle} formatter={tooltipFormatter as any} />
          <Bar dataKey={dataKey} fill={color} radius={radius} maxBarSize={maxBarSize} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface PieChartCardProps extends BaseChartProps {
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  donut?: boolean;
}

export function PieChartCard({
  data, dataKey = 'value', nameKey = 'name', height = 256,
  colors = chartColors, innerRadius, outerRadius,
  paddingAngle = 3, donut,
  className,
}: PieChartCardProps) {
  const ir = innerRadius ?? (donut ? 55 : 0);
  const or = outerRadius ?? 80;
  return (
    <div className={cn('h-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={ir} outerRadius={or} dataKey={dataKey} nameKey={nameKey} paddingAngle={paddingAngle}>
            {data.map((_: any, idx: number) => (
              <Cell key={idx} fill={colors[idx % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={defaultTooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface LineChartCardProps extends BaseChartProps {
  dataKey: string;
  xKey?: string;
  color?: string;
  showGrid?: boolean;
  tickFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any) => [string, string];
}

export function LineChartCard({
  data, dataKey, xKey = 'name', height = 256,
  color = 'hsl(var(--chart-1))',
  showGrid = false, tickFormatter, tooltipFormatter,
  className,
}: LineChartCardProps) {
  return (
    <div className={cn('h-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />}
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
          <Tooltip contentStyle={defaultTooltipStyle} formatter={tooltipFormatter as any} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieChartLegend({ data, dataKey = 'value', nameKey = 'name', colors = chartColors }: { data: any[]; dataKey?: string; nameKey?: string; colors?: string[] }) {
  const filtered = data.filter((d: any) => d[dataKey] > 0);
  if (!filtered.length) return null;
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2">
      {filtered.map((d: any, i: number) => (
        <div key={d[nameKey]} className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
          <span className="text-3xs text-muted-foreground">{d[nameKey]}: {d[dataKey]}</span>
        </div>
      ))}
    </div>
  );
}

export { ChartCard };
