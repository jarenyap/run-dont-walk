import { collection, doc, increment, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebaseConfig";
import type { Comment } from "../types";

export async function addComment(
    runId: string,
    authorUid: string,
    authorName: string,
    authorAvatarUrl: string | null,
    text:string
): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    const batch = writeBatch(db);
    const commentRef = doc(collection(db, "runs", runId, "comments"));

    batch.set(commentRef, {
        id: commentRef.id,
        runId,
        authorUid,
        authorName,
        authorAvatarUrl,
        text: trimmed,
        createdAt: serverTimestamp(),
    });

    batch.update(doc(db, "runs", runId), {
        commentCount: increment(1),
    });

    await batch.commit();
}

export function subscribeToComments(
    runId: string,
    onUpdate: (comments: Comment[]) => void
): () => void {
    const commentsQuery = query(
        collection(db, "runs", runId, "comments"),
        orderBy("createdAt", "asc")
    );
    
    return onSnapshot(commentsQuery, (snapshot) => {
        const comments = snapshot.docs.map(
            (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Comment
        );
        onUpdate(comments);
    });
}

