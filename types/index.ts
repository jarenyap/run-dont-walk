import { Timestamp, FieldValue } from "firebase/firestore";

export type RunType = "easy" | "tempo" | "long" | "race";
export type NewRun = Omit<Run, "id" | "createdAt" | "likes" | "commentCount">;
export type EventDifficulty = "easy" | "moderate" | "hard";
export type WarStatus = "active" | "completed";
export type FollowRequestStatus = "pending" | "accepted" | "rejected";
export type ClanRole = "Leader" | "Co-Leader" | "Moderator" | "Member";

export interface UserProfile {
  id: string;
  name: string;
  nameLower: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  totalDistance: number;
  totalRuns: number;
  followingIds: string[];
  followerIds: string[];
  followersCount: number;
  clanIds: string[];
  createdAt: Timestamp | FieldValue;
}

export interface Run {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  title: string;
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
  authorUid: string;
  authorName: string;
  authorAvatarUrl: string | null;
  text: string;
  createdAt: Timestamp;
}

export interface ClanAnnouncement {
  text: string;
  authorName: string;
  updatedAt: Timestamp;
}

export interface Clan {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  bannerUrl: string | null;
  leaderId: string;
  coLeaderIds: string[];
  moderatorIds: string[];
  memberIds: string[]; // includes leader, co-leaders, moderators, and regular members
  currentWarId: string | null;
  announcement: ClanAnnouncement | null;
  createdAt: Timestamp;
}

export interface ClanJoinRequest {
  id: string;
  clanId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  status: FollowRequestStatus;
  createdAt: Timestamp;
}

export interface ClanPermissions {
  canStartWar: boolean;
  canAcceptJoinRequest: boolean;
  canRemoveMember: boolean;
  canPostAnnouncement: boolean;
  canPromoteDemote: boolean;
  canTransferLeadership: boolean;
  canEditClan: boolean;
  canDisbandClan: boolean;
}

export interface ClanWar {
  id: string;
  clan1Id: string;
  clan1Name: string;
  clan2Id: string;
  clan2Name: string;
  clan1Distance: number;
  clan2Distance: number;
  startedAt: Timestamp;
  endsAt: Timestamp;
  status: WarStatus;
  winnerId: string | null;
  initiatedBy: string;
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