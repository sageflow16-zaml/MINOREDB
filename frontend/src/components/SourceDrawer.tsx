import { SourceRead } from '../types';

export const SourceDrawer = ({ source, onClose }: { source: SourceRead; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
    <div className="bg-white dark:bg-slate-900 w-full max-w-lg p-6 shadow-xl overflow-y-auto">
      <div className="flex justify-between mb-4">
        <h3 className="text-xl font-bold">Source Details</h3>
        <button onClick={onClose} className="text-slate-500">Close</button>
      </div>
      <div className="space-y-4">
        <div><h4 className="font-semibold">Raw Text</h4><pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2">{source.raw_text}</pre></div>
        <div><h4 className="font-semibold">Normalized Text</h4><pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2">{source.normalized_text}</pre></div>
        <div><h4 className="font-semibold">Metadata</h4><pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2">{JSON.stringify(source.source_metadata, null, 2)}</pre></div>
      </div>
    </div>
  </div>
);
