import { Link } from 'react-router';

export function SiteHeader() {
  return (
    <header className="bg-forest text-white shadow-md">
      <div className="mx-auto flex max-w-5xl px-4 py-4">
        <Link to="/" className="flex items-center gap-3.5">
          <img src="/logo.png" alt="" className="h-25 w-25 object-contain" />
          <span className="text-3xl font-bold tracking-tight">EcoHarmony Park</span>
        </Link>
      </div>
    </header>
  );
}
