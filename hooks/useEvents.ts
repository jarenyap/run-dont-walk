import { useState, useEffect, useMemo } from "react";
import { rsvpedEvents, allEvents, pastEvent } from "../services/eventService";
import type { Event, Region } from "../types/index";

export const useEvents = (
    uid: string | undefined,
    mode: "all" | "rsvped",
    region?: Region | "All"
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

        const handleEvents = (incoming: Event[]) => {
            setEvents(incoming);
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
                : allEvents(handleEvents, handleError);
        return () => unsubscribe();
    }, [uid, mode]);

    const filtered = useMemo(() => {
        if (!region || region === "All") return events;
        return events.filter((event) => event.region === region);
    }, [events, region]);

    const now = Date.now();
    return {
        loading,
        error,
        upcomingEvents: filtered.filter((event) => !pastEvent(event, now)),
        pastEvents: filtered.filter((event) => pastEvent(event, now)).reverse(),
    };
};
