// Začasna vsebina strani, dokler je ne izdela issue, ki ga stran navaja (I-06).
export default function PraznaStran({ naslov, issue }) {
  return (
    <main>
      <h1>{naslov}</h1>
      <p>Stran je v pripravi ({issue}).</p>
    </main>
  );
}
