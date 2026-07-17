export const StatCard = ({ title, value }: { title: string; value: number | string }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{value}</p>
  </div>
);
