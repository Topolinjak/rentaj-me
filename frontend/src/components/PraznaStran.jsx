// Začasna vsebina strani, dokler je ne izdela issue, ki ga stran navaja (I-06).
export default function PraznaStran({ naslov, issue }) {
  return (
    <main className="mx-auto max-w-vsebina px-4 py-8">
      <h1 className="text-naslov font-bold text-gray-900">{naslov}</h1>
      <p className="mt-2 text-sm text-gray-600">Stran je v pripravi ({issue}).</p>
    </main>
  );
}
