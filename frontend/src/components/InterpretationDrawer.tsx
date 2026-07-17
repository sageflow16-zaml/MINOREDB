import { InterpretationRead } from '../types';

export const InterpretationDrawer = ({ interpretation, onClose }: { interpretation: InterpretationRead; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
    <div className="bg-white dark:bg-slate-900 w-full max-w-lg p-6 shadow-xl overflow-y-auto">
      <div className="flex justify-between mb-4">
        <h3 className="text-xl font-bold">Interpretation Details</h3>
        <button onClick={onClose} className="text-slate-500">Close</button>
      </div>
      <div className="space-y-4">
        <div><h4 className="font-semibold">Statement</h4><p>{interpretation.interpretation_statement}</p></div>
        <div><h4 className="font-semibold">Reasoning Chain</h4><p>{interpretation.reasoning_chain}</p></div>
        <div><h4 className="font-semibold">Foundation</h4><p>{interpretation.interpretation_foundation}</p></div>
        <div><h4 className="font-semibold">Linked Concept</h4><p>{interpretation.concept_id}</p></div>
        <div><h4 className="font-semibold">Created At</h4><p>{interpretation.created_at}</p></div>
      </div>
    </div>
  </div>
);
