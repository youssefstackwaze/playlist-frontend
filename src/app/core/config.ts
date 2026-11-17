/**
 * Backend API base URL, injected at build time with Angular's `define` option:
 *  - development (angular.json): '/api'  -> proxied to http://localhost:8080 by proxy.conf.json
 *  - production on Render: ng build --define "API_BASE_URL='https://<backend>.onrender.com/api'"
 */
declare const API_BASE_URL: string;

const injected = typeof API_BASE_URL === 'string' ? API_BASE_URL.trim().replace(/\/+$/, '') : '';

if (!injected) {
  console.warn('API_BASE_URL is empty: falling back to /api (set it when building for production).');
}

export const apiBaseUrl: string = injected || '/api';

/** Backend root (without /api), used for links such as Swagger UI. */
export const backendUrl: string = apiBaseUrl.replace(/\/api$/, '');
