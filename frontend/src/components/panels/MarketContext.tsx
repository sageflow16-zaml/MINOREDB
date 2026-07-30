import { Globe, Radio } from 'lucide-react';

export function MarketContext({ previewMode }: { previewMode?: boolean }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 mb-2">
        <Globe className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Research Context</h3>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 flex-1 py-4 px-2 border border-dashed border-border rounded-lg bg-muted/20">
        <Radio className="w-6 h-6 text-muted-foreground/40" />
        <p className="text-2xs text-muted-foreground text-center leading-relaxed">
          Market context — including correlated instruments, economic data, regime detection, and news — will populate automatically once a project with live data sources is connected. No simulated or placeholder data is displayed.
        </p>
      </div>
    </div>
  );
}
