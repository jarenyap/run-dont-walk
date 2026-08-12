import { collection, doc, query, where, orderBy, getDoc, getDocs, onSnapshot,
    serverTimestamp, increment, writeBatch } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { NewRun, Run } from "../types";

export const logRun = async (newRun: NewRun): Promise<string> => {
    try {
        const batch = writeBatch(db);

        const runRef = doc(collection(db, "runs"));
        batch.set(runRef, {
            ...newRun,
            createdAt: serverTimestamp(),
            likes: [],
            commentCount: 0,
        });

        const userRef = doc(db, "users", newRun.userId);
        batch.update(userRef, {
            totalRuns: increment(1),
            totalDistance: increment(newRun.distance),
        });

        await batch.commit();

        // clan war hook to increment active war distance
        try {
            const userSnap = await getDoc(doc(db, "users", newRun.userId));
            const clanIds: string[] = userSnap.exists() ? (userSnap.data().clanIds ?? []) : [];
            if (clanIds.length > 0) {
                const { handleRunDistance } = await import("./clanWarService");
                handleRunDistance(newRun.userId, clanIds, newRun.distance);
            }
        } catch (warError) {
            console.error("Failed to update clan war distances:", warError);
        }

        return runRef.id;
    } catch (error) {
        console.error("Error logging run:", error);
        throw error;
    }
};

export const getUserRuns = async (userId: string): Promise<Run[]> => {
    const q = query(
        collection(db, "runs"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Run));
};

export const subscribeToUserRuns = (
    userId: string,
    onData: (runs: Run[]) => void,
    onError: (err: Error) => void
) => {
    const q = query(
        collection(db, 'runs'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q,
        (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Run[];
            onData(data);
        },
        onError
    );
};