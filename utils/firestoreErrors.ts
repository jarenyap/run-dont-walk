export interface firestoreError {
    customData?: {
        serverResponse?: string;
    };
}

export function isFirestoreError(error: unknown): error is firestoreError {
    return (
        typeof error === "object" &&
        error !== null &&
        "customData" in error
    );
}