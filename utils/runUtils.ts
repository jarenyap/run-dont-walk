export const computePace = (duration: string, distance: number): string => {
    if (distance <= 0) return '--';
    const parts = duration.split(':').map(Number);
    let totalSeconds = 0;

    if (parts.length === 3) {
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        totalSeconds = parts[0] * 60 + parts[1];
    }

    if (totalSeconds <= 0) return '--';

    const paceSeconds = totalSeconds / distance;
    const paceMin = Math.floor(paceSeconds / 60);
    const paceSec = Math.floor(paceSeconds % 60);
    return `${paceMin}:${String(paceSec).padStart(2, '0')}/km`;
};