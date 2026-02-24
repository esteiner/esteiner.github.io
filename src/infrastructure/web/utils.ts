export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Detects if the current web app is running as an installed PWA.
 * Works on both iOS (via navigator.standalone) and Android (via display-mode).
 *
 * @returns True if running as installed PWA, false if running in browser
 */
export function isPWAInstalled(): boolean {
  // Check for standalone mode using a media query
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check for iOS standalone mode
  if ('standalone' in window.navigator && window.navigator.standalone) {
    return true;
  }

  // Fallback: Check if opened from the home screen on some Android browsers
  return document.referrer.includes('android-app://');
}

/**
 * Builds a URL with optional query parameters, hash fragment, and custom base.
 *
 * @param path - The URL path
 * @param params - Optional query parameters as key-value pairs
 * @param hash - Optional hash fragment
 * @param base - Optional base URL (defaults to window.location.href)
 *
 * @returns The complete URL object
 */
export function buildUrl(path: string, params?: Record<string, string>, hash?: string | null, base?: string) {
  const url = new URL(path, base || window.location.href);

  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  if (hash) {
    url.hash = hash;
  }

  return url;
}

/**
 * Converts an unknown value to an integer value.
 *
 * @param value - Any value that should be converted to an integer
 *
 * @example
 * ```
 * const I18N_CACHING_EXPIRATION_TIME = getIntValue(process.env.FRONTEND_I18N_CACHING_EXPIRATION_TIME || '30000');
 * ```
 */
export const getIntValue = (value: unknown) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return parseInt(value, 10);
  }

  return NaN;
};

/**
 * Converts an unknown value to a boolean value.
 * Implements converting strings like 0 to false, or 1 to true etc.
 *
 * @param value - Any value that should be converted to a boolean
 *
 * @example
 * ```
 * const DISABLE_JOIN_REQUESTS = getBooleanValue(process.env.DISABLE_JOIN_REQUESTS || 'false')
 * ```
 */
export const getBooleanValue = (value: unknown) => {
  // Convert non-string values to booleans…
  if (typeof value !== 'string') {
    return !!value;
  }

  return value === '1' || value.toLowerCase() === 'true';
};

/**
 * Returns the build version defined as an attribute value on the given HTML element.
 *
 * @example
 * ```
 * console.info(`App: ${getBuildVersion()}`);
 * ```
 */
export const getBuildVersion = () => {
  return document.querySelector<HTMLElement>('html')?.getAttribute('data-build-version') || 'n/a';
};
