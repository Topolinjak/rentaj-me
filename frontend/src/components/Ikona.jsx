// Preproste črtne ikone (mreža 24 × 24) za gumbe, značke in obvestila. Narisane ročno, da za
// nekaj ikon ne potrebujemo knjižnice (dokument 07, 2). Ikona je vedno okras ob besedilu, zato
// je skrita bralnikom zaslona; gumb samo z ikono mora imeti aria-label.

const IKONE = {
  ura: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  kljukica: <path d="M5 12.5l4.5 4.5L19 7" />,
  kriz: <path d="M6 6l12 12M18 6L6 18" />,
  precrtano: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </>
  ),
  puscicaVen: (
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  ),
  // Ura z »oklepajem« (budilka): zamujena izposoja.
  budilka: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2M5 3L2 6M19 3l3 3" />
    </>
  ),
  opozorilo: <path d="M12 3.5L21.5 20h-19L12 3.5zM12 10v4M12 17v.01" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.01" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  nalaganje: <path d="M12 3a9 9 0 1 0 9 9" />,
  puscicaGor: <path d="M12 19V5M6 11l6-6 6 6" />,
  puscicaDol: <path d="M12 5v14M6 13l6 6 6-6" />,
  razvrsti: <path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4" />,
  levo: <path d="M15 6l-6 6 6 6" />,
  desno: <path d="M9 6l6 6-6 6" />,
  // Prazen predal: prazna stanja.
  predal: <path d="M3 13h5l1.5 3h5L16 13h5M5.5 5h13L21 13v6H3v-6L5.5 5z" />,
};

export default function Ikona({ ime, className = 'size-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {IKONE[ime]}
    </svg>
  );
}
