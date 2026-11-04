/**
 * Today's UTC date as YYYY-MM-DD.
 * @returns {string}
 */
export const utcToday = () => new Date().toISOString().slice(0, 10)
