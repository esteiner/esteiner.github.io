/**
 * Raised when an operation that requires an authenticated Solid session is
 * attempted without one (e.g. a manual sync while logged out). The UI can catch
 * this to prompt for login.
 */
export class NotAuthenticatedError extends Error {
    constructor() {
        super("This operation requires an authenticated Solid session.");
        this.name = "NotAuthenticatedError";
    }
}
