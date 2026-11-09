import { House, PointEvent, TeacherAccount, Competition, Student } from '../types';
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

export const INITIAL_COMPETITIONS: Competition[] = [
  {
    id: 'comp_athletics_championship',
    name: 'Inter-House Athletics Championship',
    category: 'Sports & Athletics',
    term: 'Term 1',
    order: 0,
    isActive: true,
    description: 'Track and field championship events including 100m, 200m, 400m, relays, and field events.',
    recipientMode: 'custom_roster',
    customStudentIds: ['stu_tw_01', 'stu_tw_02', 'stu_tu_01', 'stu_tu_02', 'stu_tg_01', 'stu_tg_02', 'stu_tm_01', 'stu_tm_02'],
    allowedScores: [
      { points: 100, label: '1st Place' },
      { points: 75, label: '2nd Place' },
      { points: 50, label: '3rd Place' },
      { points: 25, label: '4th Place' },
      { points: 10, label: 'Participation / Entry' },
    ],
  },
  {
    id: 'comp_swimming_sports',
    name: 'Inter-House Swimming Sports',
    category: 'Sports & Athletics',
    term: 'Term 1',
    order: 1,
    isActive: true,
    recipientMode: 'custom_roster',
    customStudentIds: ['stu_tw_03', 'stu_tw_07', 'stu_tu_04', 'stu_tu_09', 'stu_tg_03', 'stu_tg_07', 'stu_tm_03', 'stu_tm_07'],
    description: 'Aquatics championship including 50m freestyle, backstroke, breaststroke, and house relays.',
    allowedScores: [
      { points: 100, label: '1st Place' },
      { points: 75, label: '2nd Place' },
      { points: 50, label: '3rd Place' },
      { points: 25, label: '4th Place' },
      { points: 10, label: 'Participation' },
    ],
  },
  {
    id: 'comp_haka_competition',
    name: 'Inter-House Haka & Waiata Competition',
    category: 'Kaupapa Māori & Haka',
    term: 'Term 2',
    order: 2,
    isActive: true,
    description: 'School-wide traditional haka performance, spirit, wairua, and brotherhood unity.',
    allowedScores: [
      { points: 150, label: '1st Place' },
      { points: 100, label: '2nd Place' },
      { points: 75, label: '3rd Place' },
      { points: 50, label: '4th Place' },
    ],
  },
  {
    id: 'comp_cross_country',
    name: 'Senior Cross Country',
    category: 'Sports & Athletics',
    term: 'Term 2',
    order: 3,
    isActive: true,
    description: 'Annual GBHS cross country run and house participation challenge.',
    allowedScores: [
      { points: 100, label: '1st Place' },
      { points: 75, label: '2nd Place' },
      { points: 50, label: '3rd Place' },
      { points: 25, label: '4th Place' },
      { points: 10, label: 'Participation' },
    ],
  },
  {
    id: 'comp_academic_quiz',
    name: 'Academic Quiz & Science Bowl',
    category: 'Academic & STEM',
    term: 'Term 3',
    order: 4,
    isActive: true,
    description: 'Inter-house trivia, mathematics challenges, and STEM quiz bowl competitions.',
    allowedScores: [
      { points: 80, label: '1st Place' },
      { points: 60, label: '2nd Place' },
      { points: 40, label: '3rd Place' },
      { points: 20, label: '4th Place' },
      { points: 10, label: 'Participation' },
    ],
  },
  {
    id: 'comp_debating_public_speaking',
    name: 'Debating & Public Speaking Round',
    category: 'Arts & Cultural',
    term: 'Term 3',
    order: 5,
    isActive: true,
    description: 'Inter-house formal debates and oratory speeches in English and te reo Māori.',
    allowedScores: [
      { points: 80, label: '1st Place' },
      { points: 60, label: '2nd Place' },
      { points: 40, label: '3rd Place' },
      { points: 20, label: '4th Place' },
    ],
  },
  {
    id: 'comp_tug_of_war',
    name: 'House Spirit & Tug-of-War Trophy',
    category: 'Sports & Athletics',
    term: 'Term 4',
    order: 6,
    isActive: true,
    description: 'Year-end strength and unity contest between junior and senior house teams.',
    allowedScores: [
      { points: 100, label: '1st Place' },
      { points: 75, label: '2nd Place' },
      { points: 50, label: '3rd Place' },
      { points: 25, label: '4th Place' },
    ],
  },
  {
    id: 'comp_tutor_group_merits',
    name: 'Weekly Tutor Group Attendance & Merits',
    category: 'Attendance & Merits',
    term: 'All Year',
    order: 7,
    isActive: true,
    description: 'Attendance targets, positive behavior referrals, uniform pride, and pastoral merits.',
    allowedScores: [
      { points: 50, label: 'Excellence (Gold)' },
      { points: 30, label: 'Commendation (Silver)' },
      { points: 15, label: 'Merit Award' },
      { points: 5, label: 'Weekly Tutor Check' },
    ],
  },
];

export const INITIAL_STUDENTS: Student[] = [
  // Tāwhirimātea (Purple)
  { id: 'stu_tw_01', name: 'Wiremu Karaitiana', houseId: 'tawhirimatea', yearLevel: 12, tutorGroup: '12TW' },
  { id: 'stu_tw_02', name: 'Rawiri Henderson', houseId: 'tawhirimatea', yearLevel: 11, tutorGroup: '11TW' },
  { id: 'stu_tw_03', name: 'Caleb Rangi', houseId: 'tawhirimatea', yearLevel: 10, tutorGroup: '10TW' },
  { id: 'stu_tw_04', name: 'Nikau Tamati', houseId: 'tawhirimatea', yearLevel: 13, tutorGroup: '13TW' },
  { id: 'stu_tw_05', name: 'Liam Macfarlane', houseId: 'tawhirimatea', yearLevel: 9, tutorGroup: '9TW' },
  { id: 'stu_tw_06', name: 'Te Koha Milner', houseId: 'tawhirimatea', yearLevel: 12, tutorGroup: '12TW' },
  { id: 'stu_tw_07', name: 'Flynn Anderson', houseId: 'tawhirimatea', yearLevel: 11, tutorGroup: '11TW' },
  { id: 'stu_tw_08', name: 'Noah Te Kani', houseId: 'tawhirimatea', yearLevel: 10, tutorGroup: '10TW' },
  { id: 'stu_tw_09', name: 'Manaia Walker', houseId: 'tawhirimatea', yearLevel: 13, tutorGroup: '13TW' },
  { id: 'stu_tw_10', name: 'Ariki Kingi', houseId: 'tawhirimatea', yearLevel: 9, tutorGroup: '9TW' },

  // Tūmatauenga (Red)
  { id: 'stu_tu_01', name: 'Corban Te Kanawa', houseId: 'tumatauenga', yearLevel: 12, tutorGroup: '12TU' },
  { id: 'stu_tu_02', name: 'Tamati Brown', houseId: 'tumatauenga', yearLevel: 11, tutorGroup: '11TU' },
  { id: 'stu_tu_03', name: 'Lucas Pohatu', houseId: 'tumatauenga', yearLevel: 13, tutorGroup: '13TU' },
  { id: 'stu_tu_04', name: 'Jahmaine Ropiha', houseId: 'tumatauenga', yearLevel: 10, tutorGroup: '10TU' },
  { id: 'stu_tu_05', name: 'Ethan Campbell', houseId: 'tumatauenga', yearLevel: 9, tutorGroup: '9TU' },
  { id: 'stu_tu_06', name: 'Tāne Reweti', houseId: 'tumatauenga', yearLevel: 12, tutorGroup: '12TU' },
  { id: 'stu_tu_07', name: 'Mason Green', houseId: 'tumatauenga', yearLevel: 11, tutorGroup: '11TU' },
  { id: 'stu_tu_08', name: 'Hemi McClutchie', houseId: 'tumatauenga', yearLevel: 13, tutorGroup: '13TU' },
  { id: 'stu_tu_09', name: 'Kauri Smith', houseId: 'tumatauenga', yearLevel: 10, tutorGroup: '10TU' },
  { id: 'stu_tu_10', name: 'Hunter Pene', houseId: 'tumatauenga', yearLevel: 9, tutorGroup: '9TU' },

  // Tangaroa (Ocean Blue)
  { id: 'stu_tg_01', name: 'Kauri Walker', houseId: 'tangaroa', yearLevel: 12, tutorGroup: '12TG' },
  { id: 'stu_tg_02', name: 'Isaac Moana', houseId: 'tangaroa', yearLevel: 11, tutorGroup: '11TG' },
  { id: 'stu_tg_03', name: 'Tai Hemara', houseId: 'tangaroa', yearLevel: 13, tutorGroup: '13TG' },
  { id: 'stu_tg_04', name: 'Dylan Fisher', houseId: 'tangaroa', yearLevel: 10, tutorGroup: '10TG' },
  { id: 'stu_tg_05', name: 'Te Waka Mitchell', houseId: 'tangaroa', yearLevel: 9, tutorGroup: '9TG' },
  { id: 'stu_tg_06', name: 'Carter Reedy', houseId: 'tangaroa', yearLevel: 12, tutorGroup: '12TG' },
  { id: 'stu_tg_07', name: 'Baxter Kelly', houseId: 'tangaroa', yearLevel: 11, tutorGroup: '11TG' },
  { id: 'stu_tg_08', name: 'Zion Waitoa', houseId: 'tangaroa', yearLevel: 13, tutorGroup: '13TG' },
  { id: 'stu_tg_09', name: 'Te Ahuru Manuel', houseId: 'tangaroa', yearLevel: 10, tutorGroup: '10TG' },
  { id: 'stu_tg_10', name: 'Sebastian Cole', houseId: 'tangaroa', yearLevel: 9, tutorGroup: '9TG' },

  // Tāne Mahuta (Green)
  { id: 'stu_tm_01', name: 'Hemi Ngata', houseId: 'tanemahuta', yearLevel: 12, tutorGroup: '12TM' },
  { id: 'stu_tm_02', name: 'Oliver Rakuraku', houseId: 'tanemahuta', yearLevel: 11, tutorGroup: '11TM' },
  { id: 'stu_tm_03', name: 'Maui Goldsmith', houseId: 'tanemahuta', yearLevel: 13, tutorGroup: '13TM' },
  { id: 'stu_tm_04', name: 'Jordan Tahere', houseId: 'tanemahuta', yearLevel: 10, tutorGroup: '10TM' },
  { id: 'stu_tm_05', name: 'Harrison Tuhaka', houseId: 'tanemahuta', yearLevel: 9, tutorGroup: '9TM' },
  { id: 'stu_tm_06', name: 'Niko Houkamau', houseId: 'tanemahuta', yearLevel: 12, tutorGroup: '12TM' },
  { id: 'stu_tm_07', name: 'Archie Robinson', houseId: 'tanemahuta', yearLevel: 11, tutorGroup: '11TM' },
  { id: 'stu_tm_08', name: 'Piripi Te Aho', houseId: 'tanemahuta', yearLevel: 13, tutorGroup: '13TM' },
  { id: 'stu_tm_09', name: 'Cooper Hughes', houseId: 'tanemahuta', yearLevel: 10, tutorGroup: '10TM' },
  { id: 'stu_tm_10', name: 'Wiremu Nukunuku', houseId: 'tanemahuta', yearLevel: 9, tutorGroup: '9TM' },
];


