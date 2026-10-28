export function SiteHeader() {
  return (
    <header className="bg-forest text-white shadow-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3.5 px-4 py-4">
        <img
          src="/logo.png"
          alt="Logo EcoHarmony Park"
          className="h-25 w-25 object-contain"
        />
        <span className="text-3xl font-bold tracking-tight">EcoHarmony Park</span>
      </div>
    </header>
  );
}

