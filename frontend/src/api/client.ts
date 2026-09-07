/**
 * API Client for AI Skill Navigator
 * Re-exports recommendationsApi for backward compatibility and clean modular usage.
 */
import { recommendationsApi } from '../services/api';
import type { RecommendationResponse, WorkerProfileIn } from '../types/recommendation';

export async function fetchRecommendations(profile: WorkerProfileIn): Promise<RecommendationResponse> {
  return recommendationsApi.getRecommendations(profile);
}

export default recommendationsApi;
