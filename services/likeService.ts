import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function toggleLike(
    runId: string,
    uid: string,
    isLiked: boolean
): Promise<void> {
    const runRef = doc(db, "runs", runId);
    await updateDoc(runRef, {
        likes: isLiked ? arrayRemove(uid) : arrayUnion(uid),
    });
}