// Okvir vsebine strani: največ 1200 px, 16 px ob robu na telefonu.
export default function Vsebina({ children }) {
  return <div className="mx-auto max-w-vsebina px-4 py-8">{children}</div>;
}
