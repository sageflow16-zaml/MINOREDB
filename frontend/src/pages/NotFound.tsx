import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Compass className="h-10 w-10 text-brand-500" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">404</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          The page you are looking for does not exist.
        </p>
      </div>
      <Link to="/">
        <Button variant="primary">Back to home</Button>
      </Link>
    </div>
  );
}