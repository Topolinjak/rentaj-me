// Naslov strani z neobveznim opisom in dejanji desno (npr. gumb »Nov uporabnik«).
export default function GlavaStrani({ naslov, opis, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-naslov font-bold text-gray-900">{naslov}</h1>
        {opis && <p className="mt-1 text-sm text-gray-600">{opis}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}
