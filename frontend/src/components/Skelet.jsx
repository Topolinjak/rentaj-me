// Skeleti med nalaganjem (dokument 07, 4): sive ploskve v obliki vsebine namesto vrtavke čez
// celo stran. Bralnik zaslona prebere »Nalaganje …«; animacija le, če je uporabnik ne izklopi.

function Ploskev({ className }) {
  return <div className={`rounded-osnovni bg-gray-200 motion-safe:animate-pulse ${className}`} />;
}

function Nalaganje({ children }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Nalaganje …</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

// Mreža kartic (katalog): stolpci kot v pravi mreži.
export function SkeletKartic({ stevilo = 6 }) {
  return (
    <Nalaganje>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: stevilo }, (_, i) => (
          <div key={i} className="rounded-osnovni border border-gray-300 p-4">
            <Ploskev className="aspect-video w-full" />
            <Ploskev className="mt-4 h-5 w-3/4" />
            <Ploskev className="mt-2 h-4 w-1/3" />
            <Ploskev className="mt-4 h-11 w-full" />
          </div>
        ))}
      </div>
    </Nalaganje>
  );
}

export function SkeletTabele({ vrstice = 5, stolpci = 4 }) {
  return (
    <Nalaganje>
      <div className="rounded-osnovni border border-gray-300">
        <div className="flex gap-4 border-b border-gray-300 bg-gray-100 px-4 py-3">
          {Array.from({ length: stolpci }, (_, i) => (
            <Ploskev key={i} className="h-4 flex-1 bg-gray-300" />
          ))}
        </div>
        {Array.from({ length: vrstice }, (_, i) => (
          <div key={i} className="flex gap-4 border-b border-gray-200 px-4 py-4 last:border-b-0">
            {Array.from({ length: stolpci }, (_, j) => (
              <Ploskev key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </Nalaganje>
  );
}
