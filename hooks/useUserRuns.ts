import { useState, useEffect } from 'react';
import { subscribeToUserRuns } from '../services/runService';
import { Run } from '../types/index';

export const useUserRuns = (userId: string | undefined) => {
    const [runs, setRuns] = useState<Run[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToUserRuns(
            userId,
            (data) => {
                setRuns(data);
                setLoading(false);
            },
            (err) => {
                setError(err.message || 'Failed to fetch runs');
                setLoading(false);
            }
        );

        return () => unsubscribe();  // stops the listener when you leave the page

    }, [userId]);

    return { runs, loading, error };
};