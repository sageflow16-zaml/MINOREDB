import type { BenchmarkScenario } from './types';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

export const benchmarkScenarios: BenchmarkScenario[] = [
  // ── SCORES ──
  {
    id: 'scores-psychology-weakness',
    name: 'Psychology Weakness Detection',
    description: 'Trader with repeated fear and anxiety patterns should have low psychology score',
    category: 'scores',
    data: {
      projectId: 'eval-psych-001',
      dashboard: { debrief_count: 12 },
      debriefs: Array.from({ length: 12 }, (_, i) => ({
        id: `d-${i}`,
        project_id: 'eval-psych-001',
        emotional_state: i < 9 ? 'Fear' : 'Neutral',
        discipline_score: Math.round(40 + Math.random() * 20),
        psychology_score: Math.round(30 + Math.random() * 15),
        overall_rating: Math.round(35 + Math.random() * 15),
        strengths: i % 3 === 0 ? ['Risk awareness'] : [],
        weaknesses: i % 2 === 0 ? ['Emotional control', 'Patience'] : ['Emotional control'],
        lessons_learned: 'Need to manage fear better',
        mistakes_identified: i % 3 === 0 ? ['Overtrading after loss'] : [],
        created_at: daysAgo(i * 2),
      })),
      patterns: Array.from({ length: 6 }, (_, i) => ({
        id: `p-${i}`,
        project_id: 'eval-psych-001',
        name: i < 4 ? 'Fear-based exit' : 'Overtrading',
        pattern_type: 'negative',
        category: 'psychology',
        description: i < 4 ? 'Exits trades prematurely due to fear' : 'Opens too many positions after losses',
        occurrence_count: 5 - i,
        win_rate: 0.3,
        confidence: 70,
        active: true,
      })),
      rules: [
        { id: 'r1', project_id: 'eval-psych-001', title: 'Max 2 consecutive losses', status: 'approved', category: 'risk' },
        { id: 'r2', project_id: 'eval-psych-001', title: 'Journal every trade', status: 'approved', category: 'journal' },
        { id: 'r3', project_id: 'eval-psych-001', title: 'Wait for confirmation', status: 'pending', category: 'execution' },
      ],
      profile: null,
      trades: Array.from({ length: 18 }, (_, i) => ({
        id: `t-${i}`,
        pair: i < 10 ? 'EURUSD' : 'GBPUSD',
        direction: i % 2 === 0 ? 'long' : 'short',
        pnl: i < 12 ? -25 + Math.random() * 10 : 15 + Math.random() * 30,
        rr: i < 12 ? 0.5 + Math.random() * 0.5 : 1.5 + Math.random() * 1,
        result: i < 12 ? 'loss' : 'win',
        open_time: daysAgo(i + 1),
        close_time: daysAgo(i),
      })),
    },
    expected: {
      overallScore: { min: 25, max: 55 },
      weakestCategory: 'Psychology',
      strongestCategory: 'Journal Quality',
      confidenceMin: 40,
      hasDNAInsights: true,
      conceptCount: { min: 1, max: 20 },
      patternCount: { min: 1, max: 15 },
    },
  },

  // ── DNA ──
  {
    id: 'dna-disciplined-trader',
    name: 'Disciplined Trader DNA',
    description: 'Consistent trader with high discipline should show strengths and clear DNA profile',
    category: 'dna',
    data: {
      projectId: 'eval-dna-001',
      dashboard: { debrief_count: 24 },
      debriefs: Array.from({ length: 24 }, (_, i) => ({
        id: `d-${i}`,
        project_id: 'eval-dna-001',
        emotional_state: i % 4 === 0 ? 'Confident' : 'Calm',
        discipline_score: Math.round(75 + Math.random() * 15),
        psychology_score: Math.round(70 + Math.random() * 15),
        overall_rating: Math.round(72 + Math.random() * 13),
        strengths: i % 3 === 0 ? ['Patience', 'Risk management', 'Discipline'] : ['Risk management'],
        weaknesses: i % 5 === 0 ? ['Over-analysis'] : [],
        lessons_learned: 'Sticking to the plan works',
        entry_review: 'Good entry on support',
        execution_review: 'Executed according to plan',
        exit_review: 'Exit at target',
        created_at: daysAgo(i * 1.5),
      })),
      patterns: Array.from({ length: 8 }, (_, i) => ({
        id: `p-${i}`,
        project_id: 'eval-dna-001',
        name: i < 3 ? 'Clean breakouts' : i < 6 ? 'Trend following' : 'Range trading',
        pattern_type: i < 6 ? 'positive' : 'negative',
        category: i < 6 ? 'execution' : 'risk',
        description: i < 3 ? 'Identifies breakouts correctly' : i < 6 ? 'Follows trend direction' : 'Trades against range boundaries',
        occurrence_count: 10 - i,
        win_rate: i < 6 ? 0.7 : 0.45,
        confidence: 80,
        active: true,
      })),
      rules: [
        { id: 'r1', project_id: 'eval-dna-001', title: 'Risk 1% per trade', status: 'approved', category: 'risk' },
        { id: 'r2', project_id: 'eval-dna-001', title: 'Journal every trade', status: 'approved', category: 'journal' },
        { id: 'r3', project_id: 'eval-dna-001', title: 'No trading during news', status: 'approved', category: 'risk' },
        { id: 'r4', project_id: 'eval-dna-001', title: 'Wait for confirmation candle', status: 'approved', category: 'execution' },
        { id: 'r5', project_id: 'eval-dna-001', title: 'Max 3 trades per day', status: 'approved', category: 'discipline' },
      ],
      profile: {
        trading_style: 'Swing',
        preferred_sessions: ['London', 'New York'],
        preferred_pairs: ['EURUSD', 'GBPUSD'],
        strengths: ['Risk management', 'Patience'],
        weaknesses: ['Over-analysis'],
        avg_holding_period: 240,
      },
      trades: Array.from({ length: 30 }, (_, i) => ({
        id: `t-${i}`,
        pair: i < 15 ? 'EURUSD' : 'GBPUSD',
        direction: i % 2 === 0 ? 'long' : 'short',
        pnl: i < 18 ? 30 + Math.random() * 70 : -20 + Math.random() * 15,
        rr: i < 18 ? 2 + Math.random() * 1.5 : 0.8 + Math.random() * 0.5,
        result: i < 18 ? 'win' : 'loss',
        open_time: daysAgo(i + 1),
        close_time: daysAgo(i),
      })),
    },
    expected: {
      overallScore: { min: 60, max: 90 },
      strongestCategory: 'Rule Discipline',
      expectedStrength: 'risk management',
      hasDNAInsights: true,
      dnaFields: {
        preferredSession: 'London',
        averageHoldingMinutes: 240,
      },
      patternCount: { min: 1, max: 15 },
    },
  },

  // ── PATTERNS ──
  {
    id: 'patterns-declining-concepts',
    name: 'Declining Concept Detection',
    description: 'Concepts with negative trends and many mistakes should be detected as declining patterns',
    category: 'patterns',
    data: {
      projectId: 'eval-pat-001',
      dashboard: { debrief_count: 15 },
      debriefs: Array.from({ length: 15 }, (_, i) => ({
        id: `d-${i}`,
        project_id: 'eval-pat-001',
        emotional_state: i < 8 ? 'Frustrated' : 'Tired',
        discipline_score: Math.round(45 + Math.random() * 15),
        psychology_score: Math.round(40 + Math.random() * 15),
        strengths: i % 4 === 0 ? ['Market structure knowledge'] : [],
        weaknesses: i % 2 === 0 ? ['Silver Bullet', 'Killzones', 'Liquidity grabs'] : ['Silver Bullet'],
        lessons_learned: ['Need to understand Silver Bullet better', 'Fakeouts in Killzones'],
        mistakes_identified: i % 3 === 0 ? ['Silver Bullet misidentification', 'Entering too early'] : ['Silver Bullet misidentification'],
        created_at: daysAgo(i * 2),
      })),
      patterns: Array.from({ length: 10 }, (_, i) => ({
        id: `p-${i}`,
        project_id: 'eval-pat-001',
        name: i < 5 ? 'Silver Bullet' : i < 8 ? 'Killzone entries' : 'London reversal',
        pattern_type: 'negative',
        category: i < 5 ? 'execution' : 'risk',
        description: 'Applied concept incorrectly in live trading',
        occurrence_count: 8 - i,
        win_rate: 0.3,
        confidence: 65,
        active: true,
      })),
      rules: [
        { id: 'r1', project_id: 'eval-pat-001', title: 'Only trade Silver Bullet with confirmation', status: 'pending', category: 'execution' },
        { id: 'r2', project_id: 'eval-pat-001', title: 'Skip Killzone if news pending', status: 'approved', category: 'risk' },
      ],
      profile: null,
      trades: Array.from({ length: 20 }, (_, i) => ({
        id: `t-${i}`,
        pair: 'EURUSD',
        direction: 'long',
        pnl: i < 14 ? -30 + Math.random() * 15 : 20 + Math.random() * 30,
        rr: i < 14 ? 0.6 + Math.random() * 0.4 : 1.8 + Math.random() * 1,
        result: i < 14 ? 'loss' : 'win',
        open_time: daysAgo(i + 1),
        close_time: daysAgo(i),
      })),
    },
    expected: {
      weakestConcept: 'silver bullet',
      patternCount: { min: 3, max: 15 },
      hasDNAInsights: true,
      conceptCount: { min: 3, max: 15 },
    },
  },

  // ── RECOMMENDATIONS ──
  {
    id: 'recommendations-risk-issues',
    name: 'Risk Management Recommendations',
    description: 'Trader with poor risk metrics should get risk-focused recommendations',
    category: 'recommendations',
    data: {
      projectId: 'eval-rec-001',
      dashboard: { debrief_count: 8 },
      debriefs: Array.from({ length: 8 }, (_, i) => ({
        id: `d-${i}`,
        project_id: 'eval-rec-001',
        emotional_state: 'Anxious',
        discipline_score: Math.round(30 + Math.random() * 15),
        psychology_score: Math.round(35 + Math.random() * 10),
        overall_rating: Math.round(33 + Math.random() * 12),
        weaknesses: ['Risk management', 'Position sizing'],
        lessons_learned: 'Need better stop placement',
        mistakes_identified: ['Oversized positions', 'No stop loss'],
        created_at: daysAgo(i * 3),
      })),
      patterns: Array.from({ length: 5 }, (_, i) => ({
        id: `p-${i}`,
        project_id: 'eval-rec-001',
        name: i < 3 ? 'No stop loss' : 'Oversized position',
        pattern_type: 'negative',
        category: 'risk',
        description: 'Trades without protective stops',
        occurrence_count: 6 - i,
        win_rate: 0.25,
        confidence: 75,
        active: true,
      })),
      rules: [{ id: 'r1', project_id: 'eval-rec-001', title: 'Always use stop loss', status: 'pending', category: 'risk' }],
      profile: null,
      trades: Array.from({ length: 15 }, (_, i) => ({
        id: `t-${i}`,
        pair: i < 8 ? 'EURUSD' : 'GBPUSD',
        direction: 'long',
        pnl: i < 10 ? -45 + Math.random() * 10 : 10 + Math.random() * 20,
        rr: i < 10 ? 0.3 + Math.random() * 0.3 : 1.2 + Math.random() * 0.8,
        result: i < 10 ? 'loss' : 'win',
        open_time: daysAgo(i + 1),
        close_time: daysAgo(i),
      })),
    },
    expected: {
      overallScore: { min: 20, max: 50 },
      weakestCategory: 'Risk Management',
      recommendationCount: { min: 1, max: 10 },
      hasDNAInsights: true,
      patternCount: { min: 1, max: 10 },
    },
  },

  // ── FRIDAY UNDERPERFORMANCE ──
  {
    id: 'patterns-friday-losses',
    name: 'Friday Underperformance Detection',
    description: 'Trades on Fridays consistently lose, should detect session-based pattern',
    category: 'patterns',
    data: {
      projectId: 'eval-fri-001',
      dashboard: { debrief_count: 10 },
      debriefs: Array.from({ length: 10 }, (_, i) => ({
        id: `d-${i}`,
        project_id: 'eval-fri-001',
        emotional_state: 'Neutral',
        discipline_score: 50 + Math.floor(Math.random() * 20),
        psychology_score: 45 + Math.floor(Math.random() * 20),
        strengths: [],
        weaknesses: ['End of week focus'],
        created_at: daysAgo(i * 4),
      })),
      patterns: [
        { id: 'p1', project_id: 'eval-fri-001', name: 'Friday overtrading', pattern_type: 'negative', category: 'discipline', description: 'Opens too many positions on Fridays', occurrence_count: 8, win_rate: 0.25, confidence: 70, active: true },
        { id: 'p2', project_id: 'eval-fri-001', name: 'End of week fatigue', pattern_type: 'negative', category: 'psychology', description: 'Makes impulsive decisions on Fridays', occurrence_count: 6, win_rate: 0.3, confidence: 65, active: true },
        { id: 'p3', project_id: 'eval-fri-001', name: 'Weekend holding', pattern_type: 'negative', category: 'risk', description: 'Holds losing positions over weekend', occurrence_count: 4, win_rate: 0.2, confidence: 60, active: true },
      ],
      rules: [
        { id: 'r1', project_id: 'eval-fri-001', title: 'Reduce size on Fridays', status: 'pending', category: 'risk' },
      ],
      profile: { trading_style: 'Day', preferred_sessions: ['London', 'New York'], preferred_pairs: ['EURUSD'], strengths: [], weaknesses: ['Friday discipline'], avg_holding_period: 120 },
      trades: [
        ...Array.from({ length: 5 }, (_, i) => {
          const fri = new Date();
          fri.setDate(fri.getDate() - fri.getDay() + 5 - i * 7);
          return { id: `fri-${i}`, pair: 'EURUSD', direction: 'long', pnl: -40 + Math.random() * 10, rr: 0.4, result: 'loss', open_time: fri.toISOString(), close_time: new Date(fri.getTime() + 3600000).toISOString() };
        }),
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `mon-${i}`, pair: 'EURUSD', direction: i % 2 === 0 ? 'long' : 'short',
          pnl: 20 + Math.random() * 40, rr: 1.8 + Math.random(), result: 'win',
          open_time: daysAgo(i * 3 + 2), close_time: daysAgo(i * 3 + 1),
        })),
      ],
    },
    expected: {
      patternCount: { min: 3, max: 12 },
      hasDNAInsights: true,
      conceptCount: { min: 1, max: 10 },
    },
  },

  // ── ASSET CORRELATION ──
  {
    id: 'patterns-asset-underperformance',
    name: 'Asset Underperformance Detection',
    description: 'One asset consistently loses money, should detect asset-based pattern',
    category: 'patterns',
    data: {
      projectId: 'eval-asset-001',
      dashboard: { debrief_count: 6 },
      debriefs: Array.from({ length: 6 }, (_, i) => ({
        id: `d-${i}`,
        project_id: 'eval-asset-001',
        emotional_state: 'Frustrated',
        discipline_score: 45, psychology_score: 40,
        weaknesses: ['GBPJPY trading'],
        mistakes_identified: ['Selling GBPJPY rallies'],
        created_at: daysAgo(i * 5),
      })),
      patterns: [
        { id: 'p1', project_id: 'eval-asset-001', name: 'GBPJPY losses', pattern_type: 'negative', category: 'risk', description: 'Consistently loses on GBPJPY', occurrence_count: 7, win_rate: 0.2, confidence: 80, active: true },
        { id: 'p2', project_id: 'eval-asset-001', name: 'Range trading EURUSD', pattern_type: 'positive', category: 'execution', description: 'Good range trader on EURUSD', occurrence_count: 5, win_rate: 0.7, confidence: 70, active: true },
      ],
      rules: [{ id: 'r1', project_id: 'eval-asset-001', title: 'Avoid GBPJPY', status: 'pending', category: 'risk' }],
      profile: null,
      trades: [
        ...Array.from({ length: 8 }, (_, i) => ({ id: `gj-${i}`, pair: 'GBPJPY', direction: 'short', pnl: -50 + Math.random() * 15, rr: 0.5, result: 'loss', open_time: daysAgo(i + 1), close_time: daysAgo(i) })),
        ...Array.from({ length: 6 }, (_, i) => ({ id: `eu-${i}`, pair: 'EURUSD', direction: i % 2 === 0 ? 'long' : 'short', pnl: 25 + Math.random() * 40, rr: 2, result: 'win', open_time: daysAgo(i + 10), close_time: daysAgo(i + 9) })),
      ],
    },
    expected: {
      patternCount: { min: 2, max: 10 },
      hasDNAInsights: true,
      conceptCount: { min: 1, max: 10 },
    },
  },

  // ── ALL-MODULES INTEGRATION ──
  {
    id: 'integration-balanced-trader',
    name: 'Balanced Trader — Full Intelligence Test',
    description: 'Moderately successful trader testing all intelligence dimensions simultaneously',
    category: 'scores',
    data: {
      projectId: 'eval-int-001',
      dashboard: { debrief_count: 20 },
      debriefs: Array.from({ length: 20 }, (_, i) => ({
        id: `d-${i}`,
        project_id: 'eval-int-001',
        emotional_state: i % 5 === 0 ? 'Confident' : i % 5 === 2 ? 'Anxious' : 'Calm',
        discipline_score: Math.round(55 + Math.random() * 20),
        psychology_score: Math.round(50 + Math.random() * 20),
        overall_rating: Math.round(53 + Math.random() * 17),
        strengths: i % 3 === 0 ? ['Technical analysis', 'Risk management'] : ['Technical analysis'],
        weaknesses: i % 4 === 0 ? ['Holding too long'] : [],
        lessons_learned: 'Follow the trend',
        entry_review: 'Good entries',
        exit_review: 'Need better exits',
        created_at: daysAgo(i * 2),
      })),
      patterns: Array.from({ length: 6 }, (_, i) => ({
        id: `p-${i}`,
        project_id: 'eval-int-001',
        name: i < 3 ? 'Trend following' : i < 5 ? 'Early exit' : 'Overtrading',
        pattern_type: i < 3 ? 'positive' : 'negative',
        category: i < 3 ? 'execution' : 'psychology',
        description: i < 3 ? 'Follows trends well' : 'Exits too early',
        occurrence_count: 8 - i,
        win_rate: i < 3 ? 0.65 : 0.4,
        confidence: 70,
        active: true,
      })),
      rules: [
        { id: 'r1', project_id: 'eval-int-001', title: 'Risk 2% per trade', status: 'approved', category: 'risk' },
        { id: 'r2', project_id: 'eval-int-001', title: 'Journal every trade', status: 'approved', category: 'journal' },
        { id: 'r3', project_id: 'eval-int-001', title: 'Follow the trend', status: 'approved', category: 'execution' },
        { id: 'r4', project_id: 'eval-int-001', title: 'Use ATR for stops', status: 'pending', category: 'risk' },
      ],
      profile: {
        trading_style: 'Trend',
        preferred_sessions: ['London'],
        preferred_pairs: ['EURUSD', 'GBPUSD'],
        strengths: ['Technical analysis'],
        weaknesses: ['Exit timing'],
        avg_holding_period: 180,
      },
      trades: Array.from({ length: 25 }, (_, i) => ({
        id: `t-${i}`,
        pair: i < 15 ? 'EURUSD' : 'GBPUSD',
        direction: i % 2 === 0 ? 'long' : 'short',
        pnl: i < 14 ? 25 + Math.random() * 50 : -30 + Math.random() * 20,
        rr: i < 14 ? 1.5 + Math.random() * 1 : 0.7 + Math.random() * 0.5,
        result: i < 14 ? 'win' : 'loss',
        open_time: daysAgo(i + 1),
        close_time: daysAgo(i),
      })),
    },
    expected: {
      overallScore: { min: 45, max: 75 },
      hasDNAInsights: true,
      conceptCount: { min: 2, max: 15 },
      patternCount: { min: 1, max: 10 },
      recommendationCount: { min: 1, max: 10 },
    },
  },

  // ── EDGE: EMPTY DATA ──
  {
    id: 'edge-empty-state',
    name: 'Empty State Handling',
    description: 'No data should not crash — must return graceful empty results',
    category: 'scores',
    data: {
      projectId: 'eval-edge-000',
      dashboard: { debrief_count: 0 },
      debriefs: [],
      patterns: [],
      rules: [],
      profile: null,
      trades: [],
    },
    expected: {
      overallScore: { min: 0, max: 20 },
      hasDNAInsights: false,
      conceptCount: { min: 0, max: 0 },
      patternCount: { min: 0, max: 5 },
      recommendationCount: { min: 0, max: 5 },
    },
  },

  // ── EDGE: MINIMAL DATA ──
  {
    id: 'edge-minimal-data',
    name: 'Minimal Data Graceful Degradation',
    description: 'Very few data points should still work without errors',
    category: 'scores',
    data: {
      projectId: 'eval-edge-001',
      dashboard: { debrief_count: 2 },
      debriefs: [
        { id: 'd1', project_id: 'eval-edge-001', emotional_state: 'Calm', discipline_score: 60, psychology_score: 55, overall_rating: 58, strengths: ['Patience'], weaknesses: [], created_at: daysAgo(3) },
        { id: 'd2', project_id: 'eval-edge-001', emotional_state: 'Neutral', discipline_score: 65, psychology_score: 60, overall_rating: 62, strengths: [], weaknesses: ['Timing'], created_at: daysAgo(1) },
      ],
      patterns: [
        { id: 'p1', project_id: 'eval-edge-001', name: 'Good entries', pattern_type: 'positive', category: 'execution', description: 'Identifies good entry points', occurrence_count: 2, win_rate: 0.6, confidence: 50, active: true },
      ],
      rules: [{ id: 'r1', project_id: 'eval-edge-001', title: 'Journal trades', status: 'approved', category: 'journal' }],
      profile: null,
      trades: [
        { id: 't1', pair: 'EURUSD', direction: 'long', pnl: 45, rr: 2, result: 'win', open_time: daysAgo(5), close_time: daysAgo(4) },
        { id: 't2', pair: 'GBPUSD', direction: 'short', pnl: -20, rr: 0.8, result: 'loss', open_time: daysAgo(3), close_time: daysAgo(2) },
        { id: 't3', pair: 'EURUSD', direction: 'long', pnl: 30, rr: 1.5, result: 'win', open_time: daysAgo(2), close_time: daysAgo(1) },
      ],
    },
    expected: {
      overallScore: { min: 30, max: 80 },
      hasDNAInsights: true,
      conceptCount: { min: 1, max: 8 },
      patternCount: { min: 1, max: 8 },
    },
  },
];
