import { RecommendationResponse, WorkerProfileIn } from '../types/recommendation';
import { DEMO_SCENARIOS } from '../mocks/scenarios';

/**
 * Returns the current API mode ('mock' or 'real').
 * Defaults to 'mock' if unspecified, empty, or anything other than 'real'.
 */
export function getApiMode(): string {
  const metaMode =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_API_MODE
      : undefined;
  const globalObj = globalThis as { process?: { env?: Record<string, string | undefined> } };
  const procMode = globalObj.process?.env?.VITE_API_MODE;
  return (metaMode || procMode || 'mock').trim().toLowerCase();
}

/**
 * Returns the configured backend API base URL.
 */
export function getApiBaseUrl(): string {
  const metaUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_API_BASE_URL
      : undefined;
  const globalObj = globalThis as { process?: { env?: Record<string, string | undefined> } };
  const procUrl = globalObj.process?.env?.VITE_API_BASE_URL;
  return (metaUrl || procUrl || '').trim();
}

/**
 * Evaluates whether mock mode is active.
 * Mock mode is active unless VITE_API_MODE is explicitly set to 'real'.
 */
export function isMockMode(): boolean {
  return getApiMode() !== 'real';
}

/**
 * Returns or generates a session ID for tracking recommendations.
 */
export function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'skill_navigator_session_id';
  let sessionId: string | null = null;
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionId = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }
  if (!sessionId) {
    const randomHex = Math.random().toString(36).substring(2, 10);
    sessionId = `sess_${Date.now()}_${randomHex}`;
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, sessionId);
      } catch {
        // Ignore
      }
    }
  }
  return sessionId;
}

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Service to retrieve recommendations either from verified mock scenarios
 * or the live FastAPI /api/recommendations endpoint.
 */
export const recommendationsApi = {
  async getRecommendations(
    profile: WorkerProfileIn,
    scenarioId?: string
  ): Promise<RecommendationResponse> {
    // Ensure session_id and coordinates are properly formatted
    const profileWithSession: WorkerProfileIn = {
      ...profile,
      session_id: profile.session_id || getOrCreateSessionId(),
      latitude: profile.latitude ?? null,
      longitude: profile.longitude ?? null,
    };

    if (isMockMode()) {
      // Simulate realistic network delay for smooth UX transitions
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (scenarioId) {
        const matchedScenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId);
        if (matchedScenario) {
          return {
            ...matchedScenario.response,
            profile: { ...matchedScenario.response.profile, ...profileWithSession },
          };
        }
      }

      // If no explicit scenarioId, pick best match based on occupation or default to scenario 1
      const occLower = (profile.occupation || '').toLowerCase();
      let selectedScenario = DEMO_SCENARIOS[0];

      if (
        occLower.includes('domestic') ||
        occLower.includes('house') ||
        occLower.includes('maid') ||
        occLower.includes('tailor')
      ) {
        selectedScenario = DEMO_SCENARIOS[1];
      } else if (
        occLower.includes('construction') ||
        occLower.includes('labour') ||
        occLower.includes('mason') ||
        occLower.includes('fitter')
      ) {
        selectedScenario = DEMO_SCENARIOS[2];
      } else if (
        occLower.includes('auto') ||
        occLower.includes('rickshaw') ||
        occLower.includes('driver') ||
        occLower.includes('ev')
      ) {
        selectedScenario = DEMO_SCENARIOS[3];
      }

      return {
        ...selectedScenario.response,
        profile: { ...selectedScenario.response.profile, ...profileWithSession },
      };
    }

    // REAL API MODE
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      throw new ApiError(
        'VITE_API_BASE_URL is not configured. Please set VITE_API_BASE_URL in your .env file or switch to mock mode (VITE_API_MODE=mock).',
        500
      );
    }

    const cleanUrl = baseUrl.replace(/\/+$/, '');
    const endpoint = `${cleanUrl}/api/recommendations`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Session-ID': profileWithSession.session_id || '',
        },
        body: JSON.stringify(profileWithSession),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errDetail = `Server returned status ${response.status}`;
        try {
          const errJson = await response.json();
          errDetail = errJson.detail || errJson.message || errDetail;
        } catch {
          // Non-JSON error response
        }
        throw new ApiError(errDetail, response.status);
      }

      const data: RecommendationResponse = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      }

      const err = error as Error;
      if (err.name === 'AbortError') {
        throw new ApiError(
          `Request to recommendation service timed out after 15 seconds (${cleanUrl}). Please verify the backend service is running and responsive.`,
          504
        );
      }

      const isNetworkFail =
        err.name === 'TypeError' ||
        err.message.toLowerCase().includes('failed to fetch') ||
        err.message.toLowerCase().includes('networkerror') ||
        err.message.toLowerCase().includes('econnrefused');

      if (isNetworkFail) {
        console.error(`[API Service] Connection failed to ${endpoint}:`, err);
        throw new ApiError(
          `Backend service unavailable at ${cleanUrl}. Please verify the server is running on port 8001, or set VITE_API_MODE=mock in frontend/.env.`,
          503
        );
      }

      throw new ApiError(
        err.message || 'Network error communicating with the recommendation service',
        500
      );
    }
  },
};
