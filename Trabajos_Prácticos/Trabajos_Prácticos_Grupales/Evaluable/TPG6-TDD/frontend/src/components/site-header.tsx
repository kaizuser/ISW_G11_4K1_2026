export function SiteHeader() {
  return (
    <header className="bg-forest text-white">
      <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-3">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          className="stroke-lime"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 26c0-11 7-18 20-20-1 13-8 20-19 20" />
          <path d="M6 26c5-6 9-9 14-12" />
        </svg>
        <span className="text-xl font-bold">EcoHarmony Park</span>
      </div>
    </header>
  );
}
