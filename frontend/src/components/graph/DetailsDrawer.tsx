export const DetailsDrawer = ({ node, onClose }: { node: any; onClose: () => void }) => {
  if (!node) return null;
  const { data } = node;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-900 shadow-2xl p-6 z-50 border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
      <div className="flex justify-between mb-6">
        <h3 className="text-lg font-bold">Details</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800">Close</button>
      </div>
      <div className="space-y-4 text-sm">
        <div><strong>ID:</strong> <span className="font-mono text-xs">{node.id}</span></div>
        <div><strong>Type:</strong> {data.type}</div>
        <div><strong>Label:</strong> {data.label}</div>
        <div><strong>Created At:</strong> {data.created_at || 'N/A'}</div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="font-semibold mb-2">Relations</h4>
          <pre className="text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded">
            {JSON.stringify(data.meta || {}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
