import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'moderator' | 'admin';
export type RunType = 'easy' | 'tempo' | 'long' | 'race';
export type EventDifficulty = 'easy' | 'moderate' | 'hard';
export type WarStatus = 'active' | 'completed';
export type FollowRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  totalDistance: number;
  totalRuns: number;
  role: UserRole;
  followingIds: string[];
  followerIds: string[];
  clanId: string | null;
  createdAt: Timestamp;
}

export interface Run {
  id: string;
  userId: string;
  distance: number;       // in km
  duration: string;       // HH:MM:SS
  type: RunType;
  notes: string;
  likes: string[];        // array of userIds
  commentCount: number;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  runId: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
}

export interface Clan {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  memberIds: string[];
  moderatorIds: string[];
  createdAt: Timestamp;
}

export interface ClanWar {
  id: string;
  clan1Id: string;
  clan2Id: string;
  clan1Distance: number;
  clan2Distance: number;
  startDate: Timestamp;
  endDate: Timestamp;
  status: WarStatus;
  winnerId: string | null;
}

export interface Event {
  id: string;
  creatorId: string;
  title: string;
  location: string;
  distance: number;
  difficulty: EventDifficulty;
  scheduledAt: Timestamp;
  rsvpIds: string[];
  completedAt: Timestamp | null;
  participantIds: string[];
}

export interface FollowRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FollowRequestStatus;
  createdAt: Timestamp;
}