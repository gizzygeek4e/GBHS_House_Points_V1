export type HouseId = 'tawhirimatea' | 'tumatauenga' | 'tangaroa' | 'tanemahuta';

export type PointCategory =
  | 'Sports & Athletics'
  | 'Academic & STEM'
  | 'Kaupapa Māori & Haka'
  | 'Arts & Cultural'
  | 'Attendance & Merits';

export type SchoolTerm = 'Term 1' | 'Term 2' | 'Term 3' | 'Term 4' | 'All Year';

export interface House {
  id: HouseId;
  name: string;
  crest: string;
  primaryColor: string;
  secondaryColor: string;
  accentBadgeColor: string;
  barGradient: string;
  borderStroke: string;
  glowClass: string;
  patron: string;
  meaning: string;
  motto: string;
  colorName: string;
  currentTotal: number;
  rank: number;
}

export interface PointEvent {
  id: string;
  houseId: HouseId;
  points: number;
  title: string;
  category: PointCategory;
  term: 'Term 1' | 'Term 2' | 'Term 3' | 'Term 4';
  awardedBy: string;
  teacherEmail?: string;
  timestamp: number;
  notes?: string;
}

export interface TeacherAccount {
  email: string;
  name: string;
  role: string;
  isSuperAdmin?: boolean;
}

export interface TeacherUser {
  email: string;
  name: string;
  role: string;
  picture?: string;
  token?: string;
  isTeacher: boolean;
  isPasscodeAuth?: boolean;
}
