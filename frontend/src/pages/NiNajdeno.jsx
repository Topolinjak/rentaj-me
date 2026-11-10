import { Link } from 'react-router';

// Neznana pot (404).
export default function NiNajdeno() {
  return (
    <main>
      <h1>Stran ne obstaja</h1>
      <p>Strani, ki ste jo iskali, ni mogoče najti. Morda je bila povezava napačna.</p>
      <Link to="/">Na začetno stran</Link>
    </main>
  );
}
