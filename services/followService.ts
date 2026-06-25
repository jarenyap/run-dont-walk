import { db } from "../firebaseConfig";
import { doc, writeBatch, increment, arrayUnion, arrayRemove } from "firebase/firestore";

export async function followUser(currentId: string, targetId: string): Promise<void> {
    const batch = writeBatch(db);

    batch.update(doc(db, "users", currentId), {
        followingIds: arrayUnion(targetId),
    });

    batch.update(doc(db, "users", targetId), {
        followerIds: arrayUnion(currentId),
        followersCount: increment(1),
    });

    await batch.commit();
}

export async function unfollowUser(currentId: string, targetId: string): Promise<void> {
    const batch = writeBatch(db);

    batch.update(doc(db, "users", currentId), {
        followingIds: arrayRemove(targetId),
    });

    batch.update(doc(db, "users", targetId), {
        followerIds: arrayRemove(currentId),
        followersCount: increment(-1),
    });

    await batch.commit();
}