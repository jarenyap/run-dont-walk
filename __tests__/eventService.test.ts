import {
    createEvent, rsvpEvent, cancelRsvp, eventCompleted, deleteEvent,
    rsvpedEvents, allEvents, eventById,
    eventFull, rsvped, pastEvent, canManage,
} from "../services/eventService";
import type { Event, NewEvent } from "../types/index";

/* ── mocks ── */
jest.mock("../firebaseConfig", () => ({ db: {} }));

const mockCommit = jest.fn().mockResolvedValue(undefined);
const mockAdd = jest.fn().mockResolvedValue("new-event-id");
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockDeleteDoc = jest.fn().mockResolvedValue(undefined);
const mockOnSnapshot = jest.fn(() => jest.fn()) as any;
let mockTransactionGet: jest.Mock;
let mockTransactionUpdate: jest.Mock;

jest.mock("firebase/firestore", () => ({
    addDoc: jest.fn((...args: any[]) => mockAdd(...args)),
    getDoc: jest.fn((...args: any[]) => mockGetDoc(...args)),
    getDocs: jest.fn((...args: any[]) => mockGetDocs(...args)),
    updateDoc: jest.fn((...args: any[]) => mockUpdateDoc(...args)),
    deleteDoc: jest.fn((...args: any[]) => mockDeleteDoc(...args)),
    onSnapshot: jest.fn((...args: any[]) => mockOnSnapshot(...args)),
    doc: jest.fn(
        (_db: unknown, _col: string, id: string) => ({ id, _col })
    ),
    collection: jest.fn((_db: unknown, col: string) => ({ col })),
    query: jest.fn((...args: any[]) => args),
    where: jest.fn(() => ({ __type: "where" })),
    orderBy: jest.fn(() => ({ __type: "orderBy" })),
    runTransaction: jest.fn(
        async (_db: unknown, fn: (tx: unknown) => Promise<void>) => {
            mockTransactionUpdate = jest.fn();
            const tx = { get: mockTransactionGet, update: mockTransactionUpdate } as any;
            return fn(tx);
        }
    ),
    serverTimestamp: jest.fn(() => "MOCK_SERVER_TS" as any),
    arrayUnion: jest.fn((v: unknown) => ({ __type: "arrayUnion", v })),
    arrayRemove: jest.fn((v: unknown) => ({ __type: "arrayRemove", v })),
}));

const { doc, collection, query, where, orderBy, onSnapshot, addDoc } =
    jest.requireMock("firebase/firestore");

/* ── helpers ── */
function ts(minutesFromNow: number): any {
    return {
        toDate: () => new Date(Date.now() + minutesFromNow * 60000),
        seconds: 0,
        nanoseconds: 0,
    };
}

function makeEvent(overrides: Partial<Event> = {}): Event {
    return {
        id: "ev-1",
        creatorId: "creator-uid",
        creatorName: "Creator",
        creatorAvatarUrl: null,
        title: "Morning Run",
        location: "Botanic Gardens",
        distance: 5,
        difficulty: "easy",
        region: "Central",
        description: null,
        routeDescription: null,
        organizerClanId: null,
        scheduledAt: ts(60),
        rsvpIds: [],
        createdAt: ts(-60),
        completedAt: null,
        maxParticipants: 15,
        ...overrides,
    };
}

/* ── pure helpers ── */
describe("eventFull", () => {
    it("true when rsvpIds reaches maxParticipants", () => {
        expect(
            eventFull(
                makeEvent({ maxParticipants: 2, rsvpIds: ["a", "b"] })
            )
        ).toBe(true);
    });
    it("false when under capacity", () => {
        expect(
            eventFull(
                makeEvent({ maxParticipants: 3, rsvpIds: ["a"] })
            )
        ).toBe(false);
    });
    it("false when maxParticipants is 0 (no limit)", () => {
        expect(
            eventFull(
                makeEvent({ maxParticipants: 0, rsvpIds: ["a", "b", "c"] })
            )
        ).toBe(false);
    });
});

describe("rsvped", () => {
    it("true when uid is in rsvpIds", () => {
        expect(rsvped(makeEvent({ rsvpIds: ["abc"] }), "abc")).toBe(true);
    });
    it("false when uid is not in rsvpIds", () => {
        expect(rsvped(makeEvent({ rsvpIds: ["def"] }), "abc")).toBe(false);
    });
});

describe("pastEvent", () => {
    it("true when completedAt is set", () => {
        expect(pastEvent(makeEvent({ completedAt: ts(-30) }))).toBe(true);
    });
    it("true when scheduledAt is in the past", () => {
        const now = Date.now();
        const pastTs = { toDate: () => new Date(now - 60000) } as any;
        expect(
            pastEvent(makeEvent({ scheduledAt: pastTs }), now)
        ).toBe(true);
    });
    it("false when event is in the future and not completed", () => {
        expect(pastEvent(makeEvent())).toBe(false);
    });
});

describe("canManage", () => {
    it("true when uid matches creatorId", () => {
        expect(
            canManage(makeEvent({ creatorId: "me" }), "me")
        ).toBe(true);
    });
    it("false when uid differs", () => {
        expect(
            canManage(makeEvent({ creatorId: "them" }), "me")
        ).toBe(false);
    });
});

/* ── createEvent ── */
describe("createEvent", () => {
    beforeEach(() => jest.clearAllMocks());

    it("returns the new event ID", async () => {
        mockAdd.mockResolvedValue({ id: "ev-123" });
        const id = await createEvent("uid", "Name", null, {
            title: "Test",
            location: "Here",
            distance: 10,
            difficulty: "moderate",
            region: "North",
            description: null,
            routeDescription: null,
            organizerClanId: null,
            scheduledAt: ts(120),
            maxParticipants: 20,
        } as NewEvent);
        expect(id).toBe("ev-123");
    });

    it("sets creator fields and auto-RSVPs the creator", async () => {
        mockAdd.mockResolvedValue({ id: "ev-123" });
        await createEvent("uid", "Alice", "avatar.png", {
            title: "Test",
            location: "Here",
            distance: 10,
            difficulty: "hard",
            region: "South",
            description: "a run",
            routeDescription: "turn left",
            organizerClanId: "clan-1",
            scheduledAt: ts(120),
            maxParticipants: 5,
        } as NewEvent);
        expect(mockAdd).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                creatorId: "uid",
                creatorName: "Alice",
                creatorAvatarUrl: "avatar.png",
                rsvpIds: ["uid"],
                completedAt: null,
                region: "South",
                description: "a run",
                routeDescription: "turn left",
                organizerClanId: "clan-1",
            })
        );
    });
});

/* ── rsvpEvent ── */
describe("rsvpEvent", () => {
    beforeEach(() => jest.clearAllMocks());

    it("adds uid to rsvpIds via arrayUnion in a transaction", async () => {
        mockTransactionGet = jest
            .fn()
            .mockResolvedValue({ exists: () => true, data: () => makeEvent() });
        await rsvpEvent("ev-1", "user-A");
        // verify arrayUnion was called
        const { arrayUnion: au } = jest.requireMock("firebase/firestore");
        expect(au).toHaveBeenCalledWith("user-A");
    });

    it("throws when event is full", async () => {
        mockTransactionGet = jest
            .fn()
            .mockResolvedValue({
                exists: () => true,
                data: () => makeEvent({ maxParticipants: 1, rsvpIds: ["a"] }),
            });
        await expect(rsvpEvent("ev-1", "b")).rejects.toThrow("Event is full");
    });

    it("throws when already RSVPed", async () => {
        mockTransactionGet = jest
            .fn()
            .mockResolvedValue({
                exists: () => true,
                data: () => makeEvent({ rsvpIds: ["a"] }),
            });
        await expect(rsvpEvent("ev-1", "a")).rejects.toThrow(
            "User already RSVPed"
        );
    });

    it("throws when event not found", async () => {
        mockTransactionGet = jest
            .fn()
            .mockResolvedValue({ exists: () => false });
        await expect(rsvpEvent("ev-1", "a")).rejects.toThrow(
            "Event not found"
        );
    });
});

/* ── cancelRsvp ── */
describe("cancelRsvp", () => {
    beforeEach(() => jest.clearAllMocks());

    it("removes uid from rsvpIds via transaction", async () => {
        mockTransactionGet = jest.fn().mockResolvedValue({
            exists: () => true,
            id: "ev-1",
            data: () => makeEvent(),
        });
        await cancelRsvp("ev-1", "user-A");
        expect(mockTransactionUpdate).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                rsvpIds: { __type: "arrayRemove", v: "user-A" },
            })
        );
    });

    it("throws when event not found in transaction", async () => {
        mockTransactionGet = jest
            .fn()
            .mockResolvedValue({ exists: () => false });
        await expect(cancelRsvp("ev-1", "a")).rejects.toThrow(
            "Event not found"
        );
    });

    it("throws when event has already ended", async () => {
        mockTransactionGet = jest.fn().mockResolvedValue({
            exists: () => true,
            id: "ev-1",
            data: () => makeEvent({ completedAt: ts(-60) }),
        });
        await expect(cancelRsvp("ev-1", "a")).rejects.toThrow(
            "Event has already ended"
        );
    });
});

/* ── eventCompleted ── */
describe("eventCompleted", () => {
    it("throws when caller is not the creator", async () => {
        await expect(
            eventCompleted(makeEvent({ creatorId: "them" }), "me")
        ).rejects.toThrow("Only event creator can mark this event as completed");
    });

    it("sets completedAt for the creator", async () => {
        mockUpdateDoc.mockResolvedValue(undefined);
        await eventCompleted(makeEvent({ creatorId: "me", id: "ev-1" }), "me");
        expect(mockUpdateDoc).toHaveBeenCalledWith(
            expect.anything(),
            { completedAt: "MOCK_SERVER_TS" }
        );
    });
});

/* ── deleteEvent ── */
describe("deleteEvent", () => {
    it("throws when caller is not the creator", async () => {
        await expect(
            deleteEvent(makeEvent({ creatorId: "them" }), "me")
        ).rejects.toThrow("Only event creator can delete this event");
    });

    it("deletes the document for the creator", async () => {
        mockDeleteDoc.mockResolvedValue(undefined);
        await deleteEvent(makeEvent({ creatorId: "me", id: "ev-1" }), "me");
        expect(mockDeleteDoc).toHaveBeenCalled();
    });
});

/* ── rsvpedEvents (onSnapshot) ── */
describe("rsvpedEvents", () => {
    it("subscribes with array-contains query", () => {
        const unsub = rsvpedEvents("uid-1", jest.fn());
        expect(typeof unsub).toBe("function");
        // verify query was constructed with where + orderBy
        expect(where).toHaveBeenCalledWith("rsvpIds", "array-contains", "uid-1");
        expect(orderBy).toHaveBeenCalledWith("scheduledAt", "asc");
        expect(onSnapshot).toHaveBeenCalled();
    });
});

/* ── allEvents (onSnapshot) ── */
describe("allEvents", () => {
    beforeEach(() => jest.clearAllMocks());

    it("subscribes with only orderBy (no where filter)", () => {
        const unsub = allEvents(jest.fn());
        expect(typeof unsub).toBe("function");
        expect(orderBy).toHaveBeenCalledWith("scheduledAt", "asc");
        expect(onSnapshot).toHaveBeenCalled();
    });

    it("filters out completed events", () => {
        const onUpdate = jest.fn();
        let capturedCb: any;
        mockOnSnapshot.mockImplementation((_q: any, cb: any) => {
            capturedCb = cb;
            return jest.fn();
        });
        allEvents(onUpdate);
        capturedCb({
            docs: [
                {
                    id: "1",
                    data: () => makeEvent({ id: "1", completedAt: null }),
                },
                {
                    id: "2",
                    data: () => makeEvent({ id: "2", completedAt: ts(0) }),
                },
            ],
        });
        expect(onUpdate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ id: "1" }),
            ])
        );
        const passed = onUpdate.mock.calls[0][0];
        expect(passed).toHaveLength(1);
        expect(passed[0].id).toBe("1");
    });
});

/* ── eventById ── */
describe("eventById", () => {
    it("returns null for non-existent event", async () => {
        mockGetDoc.mockResolvedValue({ exists: () => false });
        const result = await eventById("nope");
        expect(result).toBeNull();
    });

    it("returns Event for existing event", async () => {
        mockGetDoc.mockResolvedValue({
            exists: () => true,
            id: "ev-1",
            data: () => makeEvent(),
        });
        const result = await eventById("ev-1");
        expect(result).not.toBeNull();
        expect(result!.id).toBe("ev-1");
        expect(result!.title).toBe("Morning Run");
    });
});
