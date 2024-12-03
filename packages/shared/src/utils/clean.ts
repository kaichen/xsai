export const clean = <T extends Record<string, undefined | unknown> = Record<string, undefined | unknown>>(record: T) => Object.fromEntries(Object.entries(record).filter(([, v]) => v === undefined)) as Record<keyof T, Exclude<T[keyof T], unknown>>
