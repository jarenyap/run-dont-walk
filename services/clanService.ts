import { collection, doc, getDoc, getDocs, query, where, writeBatch, updateDoc, deleteDoc, arrayUnion, arrayRemove, serverTimestamp, onSnapshot, addDoc, limit } from "firebase/firestore";
import { db } from "../firebaseConfig"
import type { Clan, ClanRole, ClanPermissions, ClanJoinRequest, } from "../types/index"

export function deriveClanRole(clan: Clan, uid: string): ClanRole | null {
    if (clan.leaderId === uid) return "Leader";
    if (clan.coLeaderIds.includes(uid)) return "Co-Leader";
    if (clan.moderatorIds.includes(uid)) return "Moderator";
    if (clan.memberIds.includes(uid)) return "Member";
    return null;
}

export function getClanPermissions(role: ClanRole | null): ClanPermissions {
    const isLeaderOrCoLeader = role === "Leader" || role === "Co-Leader";
    const isModOrAbove = isLeaderOrCoLeader || role === "Moderator";
    return {
        canStartWar: isLeaderOrCoLeader,
        canAcceptJoinRequest: isModOrAbove,
        canRemoveMember: isModOrAbove,
        canPostAnnouncement: isModOrAbove,
        canPromoteDemote: isLeaderOrCoLeader,
        canTransferLeadership: role === "Leader",
        canEditClan: isLeaderOrCoLeader,
        canDisbandClan: role === "Leader",
    };
}

export async function createClan(
    uid: string,
    name: string,
    description: string,
    isPrivate: boolean,
    bannerUrl: string | null = null
) : Promise<string> {
    try {
        const clanRef = doc(collection(db, "clans"));
        const batch = writeBatch(db);

        batch.set(clanRef, {
            name,
            nameLower: name.toLowerCase(),
            description,
            isPrivate,
            bannerUrl,
            leaderId: uid,
            coLeaderIds: [],
            moderatorIds: [],
            memberIds: [uid],
            currentWarId: null,
            announcement: null,
            createdAt: serverTimestamp(),
        });

        batch.update(doc(db, "users", uid), {
            clanIds: arrayUnion(clanRef.id),
        });

        await batch.commit();
        return clanRef.id;
    } catch (error) {
        console.error("Error creating clan:", error);
        throw error;
    }
}

export async function getClanById(clanId: string): Promise<Clan | null> {
    try {
        const snap = await getDoc(doc(db, "clans", clanId));
        if(!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as Clan;
    } catch (error) {
        console.error("Error fetching clan:", error);
        throw error;
    }
}

export async function getUserClans(clanIds: string[]): Promise<Clan[]> {
  try {
    if (clanIds.length === 0) return [];
    const clans = await Promise.all(
      clanIds.map(async (id) => {
        const snap = await getDoc(doc(db, "clans", id));
        return snap.exists() ? ({ id: snap.id, ...snap.data() } as Clan) : null;
      })
    );
    return clans.filter((c): c is Clan => c !== null);
  } catch (error) {
    console.error("Error fetching user clans:", error);
    throw error;
  }
}

export async function discoverPublicClans(): Promise<Clan[]> {
  try {
    const snap = await getDocs(collection(db, "clans"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Clan));
  } catch (error) {
    console.error("Error discovering clans:", error);
    throw error;
  }
}

export async function searchPublicClansByName(term: string): Promise<Clan[]> {
  try {
    const q = query(
      collection(db, "clans"),
      where("nameLower", ">=", term),
      where("nameLower", "<=", term + "\uf8ff"),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Clan));
  } catch (error) {
    console.error("Error searching clans:", error);
    throw error;
  }
}

export function subscribeToClan(
  clanId: string,
  onUpdate: (clan: Clan | null) => void
): () => void {
  return onSnapshot(doc(db, "clans", clanId), (snap) => {
    onUpdate(snap.exists() ? ({ id: snap.id, ...snap.data() } as Clan) : null);
  });
}

export function subscribeToJoinRequests(
  clanId: string,
  onUpdate: (requests: ClanJoinRequest[]) => void
): () => void {
  const q = query(
    collection(db, "clanJoinRequests"),
    where("clanId", "==", clanId),
    where("status", "==", "pending")
  );
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClanJoinRequest)));
  });
}

export async function joinPublicClan(clanId: string, uid: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, "clans", clanId), { memberIds: arrayUnion(uid) });
    batch.update(doc(db, "users", uid), { clanIds: arrayUnion(clanId) });
    await batch.commit();
  } catch (error) {
    console.error("Error joining clan:", error);
    throw error;
  }
}

export async function requestToJoinClan(
  clanId: string,
  userId: string,
  userName: string,
  userAvatarUrl: string | null
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, "clanJoinRequests"), {
      clanId,
      userId,
      userName,
      userAvatarUrl,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    console.error("Error requesting to join clan:", error);
    throw error;
  }
}

export async function getJoinRequests(clanId: string): Promise<ClanJoinRequest[]> {
  try {
    const q = query(
      collection(db, "clanJoinRequests"),
      where("clanId", "==", clanId),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClanJoinRequest));
  } catch (error) {
    console.error("Error fetching join requests:", error);
    throw error;
  }
}

export async function acceptJoinRequest(
  requestId: string,
  clanId: string,
  userId: string
): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, "clans", clanId), { memberIds: arrayUnion(userId) });
    batch.update(doc(db, "users", userId), { clanIds: arrayUnion(clanId) });
    batch.update(doc(db, "clanJoinRequests", requestId), { status: "accepted" });
    await batch.commit();
  } catch (error) {
    console.error("Error accepting join request:", error);
    throw error;
  }
}

export async function declineJoinRequest(requestId: string): Promise<void> {
  try {
    await updateDoc(doc(db, "clanJoinRequests", requestId), { status: "rejected" });
  } catch (error) {
    console.error("Error declining join request:", error);
    throw error;
  }
}

export async function removeMember(clanId: string, uid: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, "clans", clanId), {
      memberIds: arrayRemove(uid),
      coLeaderIds: arrayRemove(uid),
      moderatorIds: arrayRemove(uid),
    });
    batch.update(doc(db, "users", uid), { clanIds: arrayRemove(clanId) });
    await batch.commit();
  } catch (error) {
    console.error("Error removing member:", error);
    throw error;
  }
}

export async function leaveClan(clanId: string, uid: string): Promise<void> {
  return removeMember(clanId, uid);
}

export async function promoteToModerator(clanId: string, uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, "clans", clanId), { moderatorIds: arrayUnion(uid) });
  } catch (error) {
    console.error("Error promoting member:", error);
    throw error;
  }
}

export async function demoteModerator(clanId: string, uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, "clans", clanId), { moderatorIds: arrayRemove(uid) });
  } catch (error) {
    console.error("Error demoting moderator:", error);
    throw error;
  }
}

export async function promoteToCoLeader(clanId: string, uid: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, "clans", clanId), {
      coLeaderIds: arrayUnion(uid),
      moderatorIds: arrayRemove(uid),
    });
    await batch.commit();
  } catch (error) {
    console.error("Error promoting to co-leader:", error);
    throw error;
  }
}

export async function demoteCoLeader(clanId: string, uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, "clans", clanId), { coLeaderIds: arrayRemove(uid) });
  } catch (error) {
    console.error("Error demoting co-leader:", error);
    throw error;
  }
}

export async function demoteCoLeaderToModerator(clanId: string, uid: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, "clans", clanId), {
      coLeaderIds: arrayRemove(uid),
      moderatorIds: arrayUnion(uid),
    });
    await batch.commit();
  } catch (error) {
    console.error("Error demoting co-leader to moderator:", error);
    throw error;
  }
}

export async function transferLeadership(
  clanId: string,
  currentLeaderUid: string,
  newLeaderUid: string
): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, "clans", clanId), {
      leaderId: newLeaderUid,
      coLeaderIds: arrayUnion(currentLeaderUid),
    });
    await batch.commit();
  } catch (error) {
    console.error("Error transferring leadership:", error);
    throw error;
  }
}

export async function postAnnouncement(
  clanId: string,
  authorName: string,
  text: string
): Promise<void> {
  try {
    await updateDoc(doc(db, "clans", clanId), {
      announcement: { text, authorName, updatedAt: serverTimestamp() },
    });
  } catch (error) {
    console.error("Error posting announcement:", error);
    throw error;
  }
}

export async function updateClanDetails(
  clanId: string,
  updates: { name?: string; description?: string; isPrivate?: boolean }
): Promise<void> {
  try {
    const finalUpdates: typeof updates & { nameLower?: string } = { ...updates };
    if (updates.name) {
        finalUpdates.nameLower = updates.name.toLowerCase();
    }
    await updateDoc(doc(db, "clans", clanId), finalUpdates);
  } catch (error) {
    console.error("Error updating clan details:", error);
    throw error;
  }
}

export async function disbandClan(clanId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "clans", clanId));
  } catch (error) {
    console.error("Error disbanding clan:", error);
    throw error;
  }
}