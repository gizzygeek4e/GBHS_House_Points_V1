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

export interface AllowedScoreOption {
  points: number;
  label?: string; // e.g. "1st Place", "2nd Place", "3rd Place", "Participation"
}

export interface Student {
  id: string;
  name: string;
  houseId: HouseId;
  yearLevel: number;
  tutorGroup?: string;
  updatedAt?: number;
  archived?: boolean;
}

export interface RecipientGroup {
  id: string;
  name: string;
  type: 'team' | 'group';
  houseId: HouseId;
  competitionId?: string;
  studentIds: string[];
  description?: string;
  createdBy?: string;
  updatedAt?: number;
}

export interface Competition {
  id: string;
  name: string;
  category: PointCategory;
  term: SchoolTerm;
  allowedScores: AllowedScoreOption[];
  order: number; // 0 = current active competition displayed at top
  isActive: boolean;
  description?: string;
  updatedAt?: number;
  recipientMode?: 'whole_school' | 'custom_roster';
  customStudentIds?: string[];
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
  competitionId?: string;
  studentRecipients?: string[];
  groupId?: string;
  groupName?: string;
}

export interface TeacherAccount {
  id?: string;
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
  isSuperAdmin?: boolean;
}

