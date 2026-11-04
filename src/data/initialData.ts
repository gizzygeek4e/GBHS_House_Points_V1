import { House, PointEvent, TeacherAccount } from '../types';
import tawhirimateaCrest from '../assets/houses/TAWHIRIMATEA_transparent.png';
import tumatauengaCrest from '../assets/houses/TUMATAUENGA_transparent.png';
import tangaroaCrest from '../assets/houses/TANGAROA_transparent.png';
import tanemahutaCrest from '../assets/houses/TANE_MAHUTA_transparent.png';

export const INITIAL_HOUSES: Record<string, Omit<House, 'currentTotal' | 'rank'>> = {
  tawhirimatea: {
    id: 'tawhirimatea',
    name: 'Tāwhirimātea',
    crest: tawhirimateaCrest,
    primaryColor: '#a2207e',
    secondaryColor: '#f472b6',
    accentBadgeColor: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-700/50',
    barGradient: 'from-[#701a75] via-[#a21caf] to-[#d946ef]',
    borderStroke: '#d946ef',
    glowClass: 'glow-tawhirimatea',
    patron: 'Atua of the Winds, Storms & Sky',
    meaning: 'The tempestuous gale and breath of the heavens, commanding speed and resilience.',
    motto: 'Whakatōhea te hau · Command the storm',
    colorName: 'Purple',
  },
  tumatauenga: {
    id: 'tumatauenga',
    name: 'Tūmatauenga',
    crest: tumatauengaCrest,
    primaryColor: '#dc2626',
    secondaryColor: '#f97316',
    accentBadgeColor: 'bg-red-950/80 text-red-300 border-red-700/50',
    barGradient: 'from-[#991b1b] via-[#dc2626] to-[#ea580c]',
    borderStroke: '#ef4444',
    glowClass: 'glow-tumatauenga',
    patron: 'Atua of War, Courage & Human Endeavour',
    meaning: 'Courage, unshakeable discipline, grit under pressure, and steadfast brotherhood.',
    motto: 'Kia toa, kia mau · Courage in battle',
    colorName: 'Red',
  },
  tangaroa: {
    id: 'tangaroa',
    name: 'Tangaroa',
    crest: tangaroaCrest,
    primaryColor: '#eab308',
    secondaryColor: '#0284c7',
    accentBadgeColor: 'bg-amber-950/80 text-amber-300 border-amber-700/50',
    barGradient: 'from-[#ca8a04] via-[#eab308] to-[#38bdf8]',
    borderStroke: '#facc15',
    glowClass: 'glow-tangaroa',
    patron: 'Atua of the Ocean, Tides & Waters',
    meaning: 'Relentless tide, depth of character, fluid adaptability, and immense ocean power.',
    motto: 'Tai timu, tai pari · The unstoppable tide',
    colorName: 'Yellow & Sky Blue',
  },
  tanemahuta: {
    id: 'tanemahuta',
    name: 'Tāne Mahuta',
    crest: tanemahutaCrest,
    primaryColor: '#84cc16',
    secondaryColor: '#16a34a',
    accentBadgeColor: 'bg-emerald-950/80 text-lime-300 border-lime-700/50',
    barGradient: 'from-[#15803d] via-[#4ade80] to-[#84cc16]',
    borderStroke: '#84cc16',
    glowClass: 'glow-tanemahuta',
    patron: 'Atua of Forests, Living Trees & Creation of Light',
    meaning: 'The towering forest giant, deep-rooted integrity, growth, and lifting others to the light.',
    motto: 'Te kōhao o te ngira · Deep roots, towering pride',
    colorName: 'Green',
  },
};

export const INITIAL_AUTHORIZED_TEACHERS: TeacherAccount[] = [
  {
    email: 'hermanf@gisboyshigh.net',
    name: 'Herman F.',
    role: 'Dean of Houses & Sports Coordinator',
    isSuperAdmin: true,
  },
  {
    email: 'k.walker@gisboyshigh.net',
    name: 'Ms. K. Walker',
    role: 'Head of Aquatics & Tangaroa House Dean',
  },
  {
    email: 'r.tekani@gisboyshigh.net',
    name: 'Matua R. Te Kani',
    role: 'Head of Kaupapa Māori & Cultural Dean',
  },
  {
    email: 'e.campbell@gisboyshigh.net',
    name: 'Dr. E. Campbell',
    role: 'Academic Dean & STEM Lead',
  },
  {
    email: 't.ngata@gisboyshigh.net',
    name: 'Mr. T. Ngata',
    role: 'Whānau Community Liaison & Tāne Mahuta Dean',
  },
  {
    email: 'sports@gisboyshigh.net',
    name: 'GBHS Sports Office',
    role: 'Director of Physical Education & Athletics',
  },
];

// Fresh school year: Initial points are set to empty (0 points for all houses)
export const INITIAL_POINT_EVENTS: PointEvent[] = [];
