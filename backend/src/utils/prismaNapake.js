// Prepoznavanje napak Prisme, ki jih pretvorimo v razumljive odgovore API-ja.

// Kršitev unikatnosti (npr. e-pošta ali inventarna številka že obstaja).
export const jeKrsitevUnikatnosti = (napaka) => napaka?.code === 'P2002';

// Zapis za update/delete ne obstaja.
export const jeNeobstojecZapis = (napaka) => napaka?.code === 'P2025';
