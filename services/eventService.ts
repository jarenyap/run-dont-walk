import {
    collection, doc, addDoc, getDoc, updateDoc, deleteDoc, query, where, orderBy, 
    onSnapshot, runTransaction, serverTimestamp, arrayUnion, arrayRemove
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import type { Event, NewEvent } from "../types/index";

export function eventFull(event: Event): boolean {
    return event.maxParticipants > 0 && event.rsvpIds.length >= event.maxParticipants;
}

export function rsvped(event: Event, uid: string): boolean {
    return event.rsvpIds.includes(uid);
}

export function pastEvent(event: Event, now: number = Date.now()): boolean {
    if (event.completedAt !== null) return true;
    return event.scheduledAt.toDate().getTime() < now;
}

export function canManage(event: Event, uid: string): boolean {
    return event.creatorId === uid;
}

export async function createEvent(
    uid: string,
    name: string,
    avatarUrl: string | null,
    event: NewEvent
): Promise<string> {
    try {
        const ref = await addDoc(collection(db, "events"), {
            ...event,
            creatorId: uid,
            creatorName: name,
            creatorAvatarUrl: avatarUrl,
            rsvpIds: [uid],
            completedAt: null,
            createdAt: serverTimestamp(),
        });
        return ref.id;
    } catch (e) {
        console.error("Error creating event: ", e);
        throw e;
    }    
}

export async function rsvpEvent(eventId: string, uid:string): Promise<void> {
    try {
        await runTransaction(db, async (trans) => {
            const ref = doc(db, "events", eventId);
            const snapshot = await trans.get(ref);
            if (!snapshot.exists()) throw new Error("Event not found");
            const event = { id: snapshot.id, ...snapshot.data() } as Event;
            if (pastEvent(event)) throw new Error("Event has already ended");
            if (rsvped(event, uid)) throw new Error("User already RSVPed");
            if (eventFull(event)) throw new Error("Event is full");
            trans.update(ref, { rsvpIds: arrayUnion(uid) });
        });
    } catch (e) {
        console.error("Error joining event: ", e);
        throw e;
    }
}

export async function cancelRsvp(eventId: string, uid: string): Promise<void> {
    try {
        await runTransaction(db, async (trans) => {
            const ref = doc(db, "events", eventId);
            const snapshot = await trans.get(ref);
            if (!snapshot.exists()) throw new Error("Event not found");
            const event = { id: snapshot.id, ...snapshot.data() } as Event;
            if (pastEvent(event)) throw new Error("Event has already ended");
            trans.update(ref, { rsvpIds: arrayRemove(uid) });
        });
    } catch (e) {
        console.error("Error leaving event: ", e);
        throw e;
    }
}

export async function eventCompleted(
    event: Event,
    uid: string,
) : Promise<void> {
    if (!canManage(event, uid)) throw new Error("Only event creator can mark this event as completed");
    await updateDoc(doc(db, "events", event.id), {
        completedAt: serverTimestamp()
    });
}

export async function deleteEvent(event: Event, uid: string): Promise<void> {
    if (!canManage(event, uid)) throw new Error("Only event creator can delete this event");
    await deleteDoc(doc(db, "events", event.id));
}

export function rsvpedEvents(
    uid: string,
    onUpdate: (events: Event[]) => void,
    onError?: (e: Error) => void
): () => void {
    const qry = query(
        collection(db, "events"),
        where("rsvpIds", "array-contains", uid),
        orderBy("scheduledAt", "asc")
    );
    return onSnapshot(qry, (snapshot) => {
        onUpdate(snapshot.docs.map((doc) => (
            { id: doc.id, ...doc.data() } as Event)));
        }, onError);
}

export function allEvents(
    onUpdate: (events: Event[]) => void,
    onError?: (e: Error) => void
): () => void {
    const qry = query(
        collection(db, "events"),
        orderBy("scheduledAt", "asc")
    );
    return onSnapshot(qry, (snapshot) => {
        const events = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Event))
            .filter((event) => event.completedAt === null);
        onUpdate(events);
    }, onError);
}

export async function eventById(eventId: string): Promise<Event | null> {
    const snapshot = await getDoc(doc(db, "events", eventId));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Event;
}