export const PageHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h2>
    <div className="flex gap-2">{children}</div>
  </div>
);
