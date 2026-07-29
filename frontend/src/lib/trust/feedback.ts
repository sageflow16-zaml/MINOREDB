import type { FeedbackRating } from './types';

const STORAGE_KEY = 'minore_feedback_ratings';

export function submitRating(rating: Omit<FeedbackRating, 'id' | 'timestamp'>): void {
  try {
    const ratings = loadRatings();
    ratings.push({
      ...rating,
      id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function getRatings(source?: string, targetType?: string): FeedbackRating[] {
  let ratings = loadRatings();
  if (source) ratings = ratings.filter((r) => r.source === source);
  if (targetType) ratings = ratings.filter((r) => r.targetType === targetType);
  return ratings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getAccuracyRate(source?: string, targetType?: string): { correct: number; helpful: number; notHelpful: number; incorrect: number; total: number } {
  const ratings = getRatings(source, targetType);
  return {
    correct: ratings.filter((r) => r.rating === 'correct').length,
    helpful: ratings.filter((r) => r.rating === 'helpful').length,
    notHelpful: ratings.filter((r) => r.rating === 'not_helpful').length,
    incorrect: ratings.filter((r) => r.rating === 'incorrect').length,
    total: ratings.length,
  };
}

function loadRatings(): FeedbackRating[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
