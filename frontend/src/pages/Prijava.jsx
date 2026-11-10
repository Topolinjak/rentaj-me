import PraznaStran from '../components/PraznaStran.jsx';

// Stran za prijavo je zunaj skupne postavitve (brez glave), zato ima svoj <main>.
export default function Prijava() {
  return (
    <main>
      <PraznaStran naslov="Prijava" issue="I-10" />
    </main>
  );
}
