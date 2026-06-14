export interface FirestoreError {
    customData?: {
        serverResponse?: string;
    };
}

export function isFirestoreError(error: unknown): error is FirestoreError {
    return (
        typeof error === "object" &&
        error !== null &&
        "customData" in error
    );
}