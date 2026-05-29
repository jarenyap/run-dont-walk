import { collection, addDoc, query, where, orderBy, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { NewRun, Run } from '../types';

export const logRun = async (newRun: NewRun): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, 'runs'), {
            ...newRun,
            createdAt: serverTimestamp(),
            likes: [],
            commentCount: 0,
        });
        return docRef.id;
    } catch (error) {
        console.error('Error logging run:', error);
        throw error;
    }
};

export const getUserRuns = async (userId: string): Promise<Run[]> => {
    try {
        const q = query(
            collection(db, 'runs'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Run));
        } catch (error) {
            console.error('Error fetching user runs:', error);
            throw error;
        }
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