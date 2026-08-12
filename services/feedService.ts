import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Run } from "../types/index";

// NOTE: Feed is built by querying runs where uid in followingIds
// For larger scale, fanout-on-write pattern (writing to each follower's feed collection on run post) would be needed for better performance

export function subscribeFeed(
    currentUserId: string,
    followingIds: string[],
    onUpdate: (runs: Run[]) => void,
    onError?: (err: Error) => void
): () => void {

    const feedIds = [currentUserId, ...followingIds];
   
    const q = query(
        collection(db, "runs"),
        where("userId", "in", feedIds.slice(0, 10)),
        orderBy("createdAt", "desc"),
        limit(30)
    );

    return onSnapshot(q, (snapshot) => {
        const runs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Run, "id">), 
        }));
        onUpdate(runs);
    }, onError);
}