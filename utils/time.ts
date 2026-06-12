import { Timestamp } from "firebase/firestore";

export function formatRelativeTime(timestamp: Timestamp): string {
    if (!timestamp) return "just now";

    const now = Date.now();
    const diffMs = now - timestamp.toDate().getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}