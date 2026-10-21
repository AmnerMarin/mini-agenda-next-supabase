export function formatTime12h(dateOrIso: string | Date): string {
    const d = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
    return d.toLocaleTimeString("en-US", {
        timeZone: "America/Lima",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

export function formatTimeStr12h(timeStr: string): string {
    const [h, m] = timeStr.split(":");
    const hours = parseInt(h, 10);
    const period = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    return `${h12}:${m} ${period}`;
}
