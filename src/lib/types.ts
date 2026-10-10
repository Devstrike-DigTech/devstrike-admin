export interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  identity: string;
  motive: string;
  featuresIntro: string;
  features: string[];
  status: 'ongoing' | 'upcoming' | 'concluded';
  industry: string;
  websiteUrl?: string;
  investUrl?: string;
  coverImage?: string;
  images: string[];
  openVacancies?: number;
}

export interface Vacancy {
  id: string;
  title: string;
  role: string;
  summary: string;
  fullDescription: string;
  responsibilitiesIntro: string;
  responsibilities: string[];
  requirementsIntro: string;
  requirements: string[];
  skillSet: string[];
  payType: string;
  salaryRange: string;
  status: 'open' | 'closed';
  projectId?: string | null;
  project?: { id: string; title: string; slug: string } | null;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  tier: 'ceo' | 'board' | 'department-head';
  summary: string;
  bio: string;
  responsibilitiesIntro: string;
  responsibilities: string[];
  skillsIntro: string;
  skills: string[];
  socials: Record<string, string>;
  avatarUrl?: string;
  sortOrder: number;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  type: 'blog' | 'news';
  category: string;
  excerpt: string;
  body: string;
  coverImage?: string;
  published: boolean;
  createdAt?: string;
}

export interface Application {
  id: string;
  name: string;
  email: string;
  coverNote: string;
  cvOriginalName: string;
  status: 'new' | 'reviewed';
  createdAt: string;
  vacancy?: { id: string; title: string };
}

export interface ContactMessage {
  id: string;
  contactType: 'enquiry' | 'investment' | 'service';
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AdminStats {
  projects: { total: number; ongoing: number };
  vacancies: { total: number; open: number };
  team: { total: number };
  posts: { total: number; drafts: number };
  applications: { total: number; new: number };
  messages: { total: number; unread: number };
}

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
}
