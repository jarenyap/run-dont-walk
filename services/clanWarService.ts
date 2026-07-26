import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  updateDoc,
  runTransaction,
  onSnapshot,
  serverTimestamp,
  increment,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

type WarStatus = "pending" | "active" | "completed";


interface ClanWarDoc {
  clan1Id: string;
  clan1Name: string;
  clan2Id: string;
  clan2Name: string;
  clan1Distance: number;
  clan2Distance: number;
  startedAt: any;       
  endsAt: any;         
  status: WarStatus;
  winnerId: string | null;
  initiatedBy: string;  // uid of the Leader/Co-Leader who sent the challenge
  createdAt: any;       // Timestamp
}

export interface ClanWarWithId extends ClanWarDoc {
  id: string;
}

// creates a new war document and sets currentWarId on both clans
export async function challengeClan(
  challengerClanId: string,
  challengerClanName: string,
  targetClanId: string,
  targetClanName: string,
  initiatedByUid: string
): Promise<string> {
  const challengerSnap = await getDoc(doc(db, "clans", challengerClanId));
  if (challengerSnap.exists() && challengerSnap.data().currentWarId) {
    const cWarSnap = await getDoc(doc(db, "clanWars", challengerSnap.data().currentWarId));
    if (cWarSnap.exists()) {
      const cStatus = cWarSnap.data().status;
      if (cStatus === "active" || cStatus === "pending") {
        throw new Error("Your clan is already in a war");
      }
    }
  }

  const targetSnap = await getDoc(doc(db, "clans", targetClanId));
  if (targetSnap.exists() && targetSnap.data().currentWarId) {
    const warSnap = await getDoc(doc(db, "clanWars", targetSnap.data().currentWarId));
    if (warSnap.exists()) {
      const status = warSnap.data().status;
      if (status === "active" || status === "pending") {
        throw new Error("Target clan is already in a war");
      }
    }
  }

  const warRef = doc(collection(db, "clanWars"));
  const batch = writeBatch(db);

  batch.set(warRef, {
    clan1Id: challengerClanId,
    clan1Name: challengerClanName,
    clan2Id: targetClanId,
    clan2Name: targetClanName,
    clan1Distance: 0,
    clan2Distance: 0,
    startedAt: serverTimestamp(),   
    endsAt: null,                   
    status: "pending" as WarStatus,
    winnerId: null,
    initiatedBy: initiatedByUid,
    createdAt: serverTimestamp(),
  });

  batch.update(doc(db, "clans", challengerClanId), { currentWarId: warRef.id });
  batch.update(doc(db, "clans", targetClanId), { currentWarId: warRef.id });

  await batch.commit();
  return warRef.id;
}

// flips status to active and starts the 14-day timer
export async function acceptChallenge(warId: string): Promise<void> {
  const now = Date.now();
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;

  await updateDoc(doc(db, "clanWars", warId), {
    status: "active",
    startedAt: serverTimestamp(),
    endsAt: new Date(now + twoWeeksMs),
  });
}

// deletes the war and clears currentWarId on both clans
export async function declineChallenge(
  warId: string,
  clan1Id: string,
  clan2Id: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "clanWars", warId));
  batch.update(doc(db, "clans", clan1Id), { currentWarId: null });
  batch.update(doc(db, "clans", clan2Id), { currentWarId: null });
  await batch.commit();
}

export async function cancelChallenge(
  warId: string,
  clan1Id: string,
  clan2Id: string
): Promise<void> {
  return declineChallenge(warId, clan1Id, clan2Id);
}

export async function getClanWar(warId: string): Promise<ClanWarWithId | null> {
  const snap = await getDoc(doc(db, "clanWars", warId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ClanWarWithId;
}

// real-time subscription to a single war document
export function subscribeToClanWar(
  warId: string,
  onUpdate: (war: ClanWarWithId | null) => void
): () => void {
  return onSnapshot(doc(db, "clanWars", warId), (snap) => {
    onUpdate(snap.exists() ? ({ id: snap.id, ...snap.data() } as ClanWarWithId) : null);
  });
}

// fetches active and pending wars a clan is involved in (clan1 or clan2)
export async function getClanActiveWars(clanId: string): Promise<ClanWarWithId[]> {
  const [snap1, snap2] = await Promise.all([
    getDocs(query(
      collection(db, "clanWars"),
      where("clan1Id", "==", clanId),
      where("status", "in", ["pending", "active"])
    )),
    getDocs(query(
      collection(db, "clanWars"),
      where("clan2Id", "==", clanId),
      where("status", "in", ["pending", "active"])
    )),
  ]);

  const wars: ClanWarWithId[] = [];
  snap1.forEach((d) => wars.push({ id: d.id, ...d.data() } as ClanWarWithId));
  snap2.forEach((d) => wars.push({ id: d.id, ...d.data() } as ClanWarWithId));
  return wars;
}

// atomically adds distance to a clan in an active war (must run in a transaction)
export async function incrementClanDistance(
  warId: string,
  clanId: string,
  clan1Id: string,
  distanceKm: number
): Promise<void> {
  const warRef = doc(db, "clanWars", warId);
  const field = clanId === clan1Id ? "clan1Distance" : "clan2Distance";

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(warRef);
    if (!snap.exists()) return;                          // war deleted
    if (snap.data().status !== "active") return;         // war not active — don't count
    tx.update(warRef, { [field]: increment(distanceKm) });
  });
}

// marks an expired war as completed, sets winner, and clears currentWarId on both clans
export async function checkAndCompleteWar(warId: string): Promise<void> {
  const warRef = doc(db, "clanWars", warId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(warRef);
    if (!snap.exists()) return;
    const data = snap.data() as ClanWarDoc;

    if (data.status !== "active") return;
    const now = Date.now();
    const end = data.endsAt instanceof Date
      ? data.endsAt.getTime()
      : data.endsAt?.toMillis?.() ?? 0;
    if (now < end) return;

    let winnerId: string | null = null;
    if (data.clan1Distance > data.clan2Distance) {
      winnerId = data.clan1Id;
    } else if (data.clan2Distance > data.clan1Distance) {
      winnerId = data.clan2Id;
    }

    tx.update(warRef, { status: "completed", winnerId });
    tx.update(doc(db, "clans", data.clan1Id), { currentWarId: null });
    tx.update(doc(db, "clans", data.clan2Id), { currentWarId: null });
  });
}

// called after every run log — finds active wars and increments clan distance
export async function handleRunDistance(
  uid: string,
  clanIds: string[],
  distanceKm: number
): Promise<void> {
  if (clanIds.length === 0) return;

  const warPromises = clanIds.map((clanId) => getClanActiveWars(clanId));
  const results = await Promise.all(warPromises);

  const seen = new Set<string>();
  const incrementPromises: Promise<void>[] = [];

  for (const wars of results) {
    for (const war of wars) {
      if (war.status !== "active") continue;
      if (seen.has(war.id)) continue;
      seen.add(war.id);

      const userClanId = clanIds.find(
        (cid) => cid === war.clan1Id || cid === war.clan2Id
      );
      if (!userClanId) continue;

      incrementPromises.push(
        incrementClanDistance(war.id, userClanId, war.clan1Id, distanceKm)
      );
    }
  }

  await Promise.all(incrementPromises);
}

export interface WarContributor {
  uid: string;
  name: string;
  avatarUrl: string | null;
  distanceKm: number;
  clanName: string;
}

// sums up runs per member during the war window and returns top N
export async function getWarTopContributors(
  warStart: Date,
  warEnd: Date,
  clanName: string,
  memberIds: string[],
  topN: number = 5
): Promise<WarContributor[]> {
  const { getUserProfiles } = await import("./userService");
  const profiles = await getUserProfiles(memberIds);
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const contributorPromises = memberIds.map(async (uid) => {
    const q = query(
      collection(db, "runs"),
      where("userId", "==", uid),
      where("createdAt", ">=", warStart),
      where("createdAt", "<=", warEnd)
    );
    const snap = await getDocs(q);
    let total = 0;
    snap.forEach((d) => {
      total += (d.data().distance || 0) as number;
    });
    return { uid, total };
  });

  const allResults = await Promise.all(contributorPromises);
  allResults.sort((a, b) => b.total - a.total);

  const results: WarContributor[] = [];
  for (const r of allResults.slice(0, topN)) {
    const profile = profileMap.get(r.uid);
    if (r.total > 0) {
      results.push({
        uid: r.uid,
        name: profile?.name ?? "Unknown Runner",
        avatarUrl: profile?.avatarUrl ?? null,
        distanceKm: Math.round(r.total * 100) / 100,
        clanName,
      });
    }
  }

  return results;
}

// fetches completed wars for a clan, sorted by most recent
export async function getPastWars(clanId: string): Promise<ClanWarWithId[]> {
  const [snap1, snap2] = await Promise.all([
    getDocs(query(
      collection(db, "clanWars"),
      where("clan1Id", "==", clanId),
      where("status", "==", "completed"),
      orderBy("endsAt", "desc"),
      limit(10)
    )),
    getDocs(query(
      collection(db, "clanWars"),
      where("clan2Id", "==", clanId),
      where("status", "==", "completed"),
      orderBy("endsAt", "desc"),
      limit(10)
    )),
  ]);

  const wars: ClanWarWithId[] = [];
  snap1.forEach((d) => {
    const data = d.data();
    if (data.endsAt == null) return;
    wars.push({ id: d.id, ...data } as ClanWarWithId);
  });
  snap2.forEach((d) => {
    const data = d.data();
    if (data.endsAt == null) return;
    wars.push({ id: d.id, ...data } as ClanWarWithId);
  });
  return wars.sort((a, b) => {
    const aEnd = a.endsAt instanceof Date ? a.endsAt.getTime() : a.endsAt?.toMillis?.() ?? 0;
    const bEnd = b.endsAt instanceof Date ? b.endsAt.getTime() : b.endsAt?.toMillis?.() ?? 0;
    return bEnd - aEnd;
  });
}
