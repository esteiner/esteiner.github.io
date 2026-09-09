/**
 * Fired on `window` after cellar contents change outside a page's own render
 * cycle (e.g. the footer ingests a photo-captured order directly into the
 * cellarwork cellar). A mounted cellarwork page listens for it and reloads,
 * because navigating to the route it is already on does not re-run its task.
 */
export const CELLAR_UPDATED_EVENT = "kellermeister:cellar-updated";
