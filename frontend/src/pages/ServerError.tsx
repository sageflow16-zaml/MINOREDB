import { Link } from 'react-router-dom';

export default function ServerError() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <span className="text-4xl text-red-600">500</span>
      </div>
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Server Error</h1>
        <p className="mt-2 text-slate-500">
          Something went wrong on our end. Please try again later.
        </p>
      </div>
      <Link
        to="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Back to home
      </Link>
    </div>
  );
}
