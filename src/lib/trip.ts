const DAY_MS = 24 * 60 * 60 * 1000;

/** 1-based day of the trip, counting `start` as day 1. */
export const dayOfTrip = (date: Date, start: Date) => Math.floor((date.getTime() - start.getTime()) / DAY_MS) + 1;
