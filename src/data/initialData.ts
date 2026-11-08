import { House, PointEvent, TeacherAccount } from '../types';
import tawhirimateaCrest from '../assets/houses/tawhirimatea.svg';
import tumatauengaCrest from '../assets/houses/tumatauenga.svg';
import tangaroaCrest from '../assets/houses/tangaroa.svg';
import tanemahutaCrest from '../assets/houses/tanemahuta.svg';

export const INITIAL_HOUSES: Record<string, Omit<House, 'currentTotal' | 'rank'>> = {
  tawhirimatea: {
    id: 'tawhirimatea',
    name: 'Tāwhirimātea',
    crest: tawhirimateaCrest,
    primaryColor: '#b9529f', // Exact background match from logo
    secondaryColor: '#c2c9cc',
    accentBadgeColor: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-700/50',
    barGradient: 'from-[#82246b] via-[#b9529f] to-[#b9529f]',
    borderStroke: '#b9529f',
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
    primaryColor: '#ef4136', // Exact background match from logo
    secondaryColor: '#fec20e',
    accentBadgeColor: 'bg-red-950/80 text-red-300 border-red-700/50',
    barGradient: 'from-[#b91c1c] via-[#ef4136] to-[#ef4136]',
    borderStroke: '#ef4136',
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
    primaryColor: '#00aeef', // Exact background match from logo
    secondaryColor: '#fff200',
    accentBadgeColor: 'bg-sky-950/80 text-sky-300 border-sky-700/50',
    barGradient: 'from-[#0284c7] via-[#00aeef] to-[#00aeef]',
    borderStroke: '#00aeef',
    glowClass: 'glow-tangaroa',
    patron: 'Atua of the Ocean, Tides & Waters',
    meaning: 'Relentless tide, depth of character, fluid adaptability, and immense ocean power.',
    motto: 'Tai timu, tai pari · The unstoppable tide',
    colorName: 'Ocean Blue',
  },
  tanemahuta: {
    id: 'tanemahuta',
    name: 'Tāne Mahuta',
    crest: tanemahutaCrest,
    primaryColor: '#39b54a', // Exact background match from logo
    secondaryColor: '#d7df23',
    accentBadgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50',
    barGradient: 'from-[#15803d] via-[#39b54a] to-[#39b54a]',
    borderStroke: '#39b54a',
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
