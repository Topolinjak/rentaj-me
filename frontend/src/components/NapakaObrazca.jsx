// Splošna napaka obrazca (npr. 409 ali nedosegljiv strežnik), nad gumbom za oddajo.
export default function NapakaObrazca({ napaka, className = '' }) {
  if (!napaka) return null;
  return (
    <p
      role="alert"
      className={`rounded-osnovni bg-napaka-ozadje px-3 py-2 text-sm text-napaka ${className}`}
    >
      {napaka}
    </p>
  );
}
