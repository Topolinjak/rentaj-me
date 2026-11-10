// Razredi za videz gumba. Uporablja jih Gumb, pa tudi povezave, ki morajo biti videti kot gumb
// (npr. »Na katalog« v praznem stanju): <Link className={slogGumba({ razlicica: 'sekundarni' })}>.

const RAZLICICE = {
  primarni: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  sekundarni: 'border-gray-300 bg-white text-gray-900 hover:bg-gray-100 active:bg-gray-200',
  nevarni: 'bg-napaka text-white hover:bg-napaka-temna active:bg-napaka-temna',
};

// Normalna velikost je visoka 44 px (najmanjša tarča za dotik, dokument 07, 6).
const VELIKOSTI = {
  normalna: 'min-h-11 px-4 text-base',
  majhna: 'min-h-8 px-3 text-sm',
};

export const slogGumba = ({ razlicica = 'primarni', velikost = 'normalna', className = '' } = {}) =>
  [
    'inline-flex items-center justify-center gap-2 rounded-osnovni border border-transparent font-medium',
    'disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-600',
    RAZLICICE[razlicica],
    VELIKOSTI[velikost],
    className,
  ].join(' ');
