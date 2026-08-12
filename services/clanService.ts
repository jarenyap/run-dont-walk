import { collection, doc, getDoc, getDocs, query, where, orderBy, startAt, endAt, writeBatch, updateDoc, deleteDoc, arrayUnion, arrayRemove, serverTimestamp, onSnapshot, addDoc, limit } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Clan, ClanRole, ClanPermissions, ClanJoinRequest } from "../types/index";
import { getClanActiveWars } from "./clanWarService";

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
    const snap = await getDoc(doc(db, "clans", clanId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Clan;
}

export async function getUserClans(clanIds: string[]): Promise<Clan[]> {
  if (clanIds.length === 0) return [];
  const clans = await Promise.all(
    clanIds.map(async (id) => {
      const snap = await getDoc(doc(db, "clans", id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as Clan) : null;
    })
  );
  return clans.filter((c): c is Clan => c !== null);
}

export async function discoverPublicClans(): Promise<Clan[]> {
  const q = query(
    collection(db, "clans"),
    where("isPrivate", "==", false),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Clan));
}

export async function searchAllClansByName(term: string): Promise<Clan[]> {
  const normalized = term.trim().toLowerCase();
  const q = query(
    collection(db, "clans"),
    orderBy("nameLower"),
    startAt(normalized),
    endAt(normalized + "\uf8ff"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Clan));
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

export async function isUserInWarWithClan(
  uid: string,
  targetClanId: string
): Promise<boolean> {
  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) return false;
  const clanIds: string[] = userSnap.data().clanIds ?? [];
  for (const cid of clanIds) {
    try {
      const wars = await getClanActiveWars(cid);
      for (const w of wars) {
        if (
          (w.clan1Id === targetClanId || w.clan2Id === targetClanId) &&
          (w.status === "active" || w.status === "pending")
        ) {
          return true;
        }
      }
    } catch {
      // if war query fails, err on the safe side — don't block
      continue;
    }
  }
  return false;
}

export async function joinPublicClan(clanId: string, uid: string): Promise<void> {
  if (await isUserInWarWithClan(uid, clanId)) {
    throw new Error("Cannot join a clan you are currently at war with");
  }
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
  const ref = await addDoc(collection(db, "clanJoinRequests"), {
    clanId,
    userId,
    userName,
    userAvatarUrl,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getJoinRequests(clanId: string): Promise<ClanJoinRequest[]> {
  const q = query(
    collection(db, "clanJoinRequests"),
    where("clanId", "==", clanId),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClanJoinRequest));
}

export async function hasPendingJoinRequest(
  clanId: string,
  userId: string
): Promise<boolean> {
  const q = query(
    collection(db, "clanJoinRequests"),
    where("clanId", "==", clanId),
    where("userId", "==", userId),
    where("status", "==", "pending"),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function acceptJoinRequest(
  requestId: string,
  clanId: string,
  userId: string
): Promise<void> {
  if (await isUserInWarWithClan(userId, clanId)) {
    throw new Error("Cannot accept a user who is currently at war with this clan");
  }
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
  await updateDoc(doc(db, "clanJoinRequests", requestId), { status: "rejected" });
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
  await updateDoc(doc(db, "clans", clanId), { moderatorIds: arrayUnion(uid) });
}

export async function demoteModerator(clanId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, "clans", clanId), { moderatorIds: arrayRemove(uid) });
}

export async function promoteToCoLeader(clanId: string, uid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "clans", clanId), {
    coLeaderIds: arrayUnion(uid),
    moderatorIds: arrayRemove(uid),
  });
  await batch.commit();
}

export async function demoteCoLeader(clanId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, "clans", clanId), { coLeaderIds: arrayRemove(uid) });
}

export async function demoteCoLeaderToModerator(clanId: string, uid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "clans", clanId), {
    coLeaderIds: arrayRemove(uid),
    moderatorIds: arrayUnion(uid),
  });
  await batch.commit();
}

export async function transferLeadership(
  clanId: string,
  currentLeaderUid: string,
  newLeaderUid: string
): Promise<void> {
  try {
    const batch = writeBatch(db);
    // remove new leader from coLeaderIds (they may have been co-leader)
    batch.update(doc(db, "clans", clanId), {
      leaderId: newLeaderUid,
      coLeaderIds: arrayRemove(newLeaderUid),
    });
    // promote old leader to co-leader
    batch.update(doc(db, "clans", clanId), {
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
  await updateDoc(doc(db, "clans", clanId), {
    announcement: { text, authorName, updatedAt: serverTimestamp() },
  });
}

export async function updateClanDetails(
  clanId: string,
  updates: { name?: string; description?: string; isPrivate?: boolean; bannerUrl?: string | null }
): Promise<void> {
  const finalUpdates: typeof updates & { nameLower?: string } = { ...updates };
  if (updates.name) {
    finalUpdates.nameLower = updates.name.toLowerCase();
  }
  await updateDoc(doc(db, "clans", clanId), finalUpdates);
}

export async function disbandClan(clanId: string): Promise<void> {
  try {
    const clanSnap = await getDoc(doc(db, "clans", clanId));
    if (!clanSnap.exists()) return;
    const memberIds: string[] = clanSnap.data().memberIds ?? [];

    const batch = writeBatch(db);
    // remove clanId from every member's user doc
    for (const uid of memberIds) {
      batch.update(doc(db, "users", uid), {
        clanIds: arrayRemove(clanId),
      });
    }
    // delete all pending join requests for this clan
    const requestsSnap = await getDocs(
      query(
        collection(db, "clanJoinRequests"),
        where("clanId", "==", clanId)
      )
    );
    requestsSnap.forEach((d) => batch.delete(d.ref));
    // delete the clan doc
    batch.delete(doc(db, "clans", clanId));
    await batch.commit();
  } catch (error) {
    console.error("Error disbanding clan:", error);
    throw error;
  }
}

export async function uploadClanBanner(
  clanId: string,
  imageURI: string
): Promise<string> {
  try {
    const imageBlob: Blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = (e) => {
        console.error("Clan banner upload failed:", e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", imageURI, true);
      xhr.send(null);
    });

    const firebaseRef = ref(storage, `clanBanners/${clanId}.jpg`);
    await uploadBytes(firebaseRef, imageBlob, {
      contentType: "image/jpeg",
    });

    (imageBlob as any).close?.();
    return await getDownloadURL(firebaseRef);
  } catch (e) {
    console.error("Clan banner upload failed:", e);
    throw e;
  }
}