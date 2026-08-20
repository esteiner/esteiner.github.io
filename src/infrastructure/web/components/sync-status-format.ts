/**
 * Format a last-sync timestamp for the UI as Swiss `d.M.yyyy@HH:mm`,
 * e.g. `8.7.2026@22:08` (day/month unpadded, time zero-padded).
 */
export function formatLastSync(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}@${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
