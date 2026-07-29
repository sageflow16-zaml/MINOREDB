import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '../../lib/utils';

interface ScatterPlotProps {
  data: Array<Record<string, unknown>>;
  xKey?: string;
  yKey?: string;
  colorKey?: string;
  xLabel?: string;
  yLabel?: string;
  className?: string;
  height?: number;
  showQuadrants?: boolean;
  xThreshold?: number;
  yThreshold?: number;
  quadrantLabels?: {
    topLeft?: string;
    topRight?: string;
    bottomLeft?: string;
    bottomRight?: string;
  };
  onPointClick?: (point: unknown) => void;
}

const RESULT_COLORS = {
  WIN: 'hsl(var(--success))',
  LOSS: 'hsl(var(--destructive))',
  BE: 'hsl(var(--warning))',
  UNKNOWN: 'hsl(var(--muted-foreground))',
};

export function ScatterPlot({
  data,
  xKey = 'x',
  yKey = 'y',
  colorKey = 'result',
  xLabel = 'X',
  yLabel = 'Y',
  className,
  height = 300,
  showQuadrants = false,
  xThreshold = 0,
  yThreshold = 0,
  quadrantLabels,
  onPointClick,
}: ScatterPlotProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        No data available
      </div>
    );
  }

  const validData = data.filter(d => d.x !== undefined && d.y !== undefined);
  if (validData.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        No valid data points
      </div>
    );
  }

  const xValues = validData.map(d => d.x as number);
  const yValues = validData.map(d => d.y as number);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  const xPadding = xRange * 0.1 || 1;
  const yPadding = yRange * 0.1 || 1;

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
          
          <XAxis
            dataKey={xKey}
            type="number"
            domain={[xMin - xPadding, xMax + xPadding]}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            label={{ value: xLabel, position: 'insideBottom', offset: -30, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          
          <YAxis
            type="number"
            domain={[yMin - yPadding, yMax + yPadding]}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 20, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: 'var(--shadow-lg)',
            }}
            formatter={(value: number, name: string) => [value.toFixed(2), name]}
          />
          
          {showQuadrants && (
            <>
              <ReferenceLine x={xThreshold} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeOpacity={0.5} />
              <ReferenceLine y={yThreshold} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeOpacity={0.5} />
            </>
          )}
          
          <Scatter
            name="Trades"
            data={validData}
            fill="hsl(var(--primary))"
            stroke="hsl(var(--primary))"
            shape="circle"
          >
            {validData.map((point, index) => (
              <circle
                key={index}
                cx={0}
                cy={0}
                r={6}
                fill={RESULT_COLORS[point[colorKey] as keyof typeof RESULT_COLORS] || RESULT_COLORS.UNKNOWN}
                opacity={0.7}
                stroke="hsl(var(--background))"
                strokeWidth={1}
                filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
              />
            ))}
          </Scatter>
          
          {quadrantLabels && showQuadrants && (
            <>
              <text
                x={xMin + xRange * 0.25}
                y={yMin + yRange * 0.15}
                fill="hsl(var(--muted-foreground))"
                fontSize={10}
                textAnchor="middle"
                opacity={0.6}
              >
                {quadrantLabels.topLeft}
              </text>
              <text
                x={xMax - xRange * 0.25}
                y={yMin + yRange * 0.15}
                fill="hsl(var(--muted-foreground))"
                fontSize={10}
                textAnchor="middle"
                opacity={0.6}
              >
                {quadrantLabels.topRight}
              </text>
              <text
                x={xMin + xRange * 0.25}
                y={yMax - yRange * 0.1}
                fill="hsl(var(--muted-foreground))"
                fontSize={10}
                textAnchor="middle"
                opacity={0.6}
              >
                {quadrantLabels.bottomLeft}
              </text>
              <text
                x={xMax - xRange * 0.25}
                y={yMax - yRange * 0.1}
                fill="hsl(var(--muted-foreground))"
                fontSize={10}
                textAnchor="middle"
                opacity={0.6}
              >
                {quadrantLabels.bottomRight}
              </text>
            </>
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface QuadrantChartProps {
  data: Array<{
    x: number;
    y: number;
    result?: string;
    [key: string]: unknown;
  }>;
  xKey?: string;
  yKey?: string;
  className?: string;
  height?: number;
  xLabel?: string;
  yLabel?: string;
}

export function QuadrantChart({
  data,
  xKey = 'x',
  yKey = 'y',
  className,
  height = 300,
  xLabel = 'Risk:Reward',
  yLabel = 'P&L',
}: QuadrantChartProps) {
  return (
    <ScatterPlot
      data={data}
      xKey={xKey}
      yKey={yKey}
      xLabel={xLabel}
      yLabel={yLabel}
      className={className}
      height={height}
      showQuadrants
      xThreshold={1}
      yThreshold={0}
      quadrantLabels={{
        topLeft: 'High RR, Loss',
        topRight: 'High RR, Profit',
        bottomLeft: 'Low RR, Loss',
        bottomRight: 'Low RR, Profit',
      }}
    />
  );
}