import { useState, useEffect } from "react";
import { rsvpedEvents, discoverEvents, pastEvent } from "../services/eventService";
import { Event } from "../types/index";

export const useEvents = (
    uid: string | undefined,
    followingIds: string[],
    mode: "rsvped" | "discover"
) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!uid) {
            setEvents([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);

        const handleEvents = (event: Event[]) => {
            setEvents(event);
            setLoading(false);
        };
        const handleError = (e: Error) => {
            setEvents([]);
            setError(e.message || "Failed to fetch events");
            setLoading(false);
        };
        const unsubscribe = 
            mode === "rsvped"
            ? rsvpedEvents(uid, handleEvents, handleError)
            : discoverEvents(uid, followingIds, handleEvents, handleError);
        return () => unsubscribe();
    }, [uid, followingIds.join(","), mode]);

    const now = Date.now();
    return {
        loading,
        error,
        upcomingEvents: events.filter((event) => !pastEvent(event, now)),
        pastEvents: events.filter((event) => pastEvent(event, now)).reverse(),
    };
};