import { Run } from "../types";

const getWeek = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7));
};

const startOfCurrWeek = () => {
  const now = new Date();
  const start = new Date(now);
  const dayOfWeek = start.getDay() || 7;
  start.setDate(start.getDate() - dayOfWeek + 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

const startOfCurrMonth = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return start;
}

export const aggregateDistance = (runs: Run[], timePeriod: "weekly" | "monthly") => {
    const avgData: { [key: string]: number } = {};
    runs.forEach((run) => {
        if (!run.createdAt) return;
        const d = Number(run.distance) || 0;
        if (d === 0) return;
        const date = run.createdAt.toDate();
        let key = "";
        if (timePeriod === "monthly") {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            key = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
        } else {
            key = `W${getWeek(date)}`;
        }
        avgData[key] = (avgData[key] || 0) + d;
    });

    return Object.keys(avgData)
        .map((label) => ({
            label,
            distance: avgData[label],
        }))
        .slice(-8);
};

export const aggregateRunTypes = (runs: Run[], timePeriod: "weekly" | "monthly") => {
    const typeData: { [key: string]: number } = {};
    let total = 0;
    const now = new Date();
    const currMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfWeek = now.getDay() || 7;
    const currWeek = startOfCurrWeek();
    runs.forEach((run) => {
        if (!run.type || !run.createdAt) return;
        const runDate = run.createdAt.toDate();
        if (timePeriod === "weekly" && runDate < currWeek) return;
        if (timePeriod === "monthly" && runDate < currMonth) return;
        typeData[run.type] = (typeData[run.type] || 0) + 1;
        total ++;
    });

    const formatted = Object.keys(typeData).map(type => ({
        type,
        count: typeData[type],
        percentage: Math.round((typeData[type] / total) * 100)
    })).sort((a, b) => b.count - a.count);
    return { runType: formatted, totalRuns: total };
}