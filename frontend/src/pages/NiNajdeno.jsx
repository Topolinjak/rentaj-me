import { Link } from 'react-router';

// Neznana pot (404).
export default function NiNajdeno() {
  return (
    <main className="mx-auto max-w-vsebina px-4 py-8">
      <h1 className="text-naslov font-bold text-gray-900">Stran ne obstaja</h1>
      <p className="mt-2">
        Strani, ki ste jo iskali, ni mogoče najti. Morda je bila povezava napačna.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-osnovni bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Na začetno stran
      </Link>
    </main>
  );
}
