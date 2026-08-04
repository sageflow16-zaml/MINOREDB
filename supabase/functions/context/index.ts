import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPENROUTER_API_KEY') || '';
const openaiBaseUrl = Deno.env.get('OPENAI_BASE_URL') || 'https://api.openai.com/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { operation, project_id, data } = await req.json() as any;
    if (!operation) return errorResponse('Missing operation');

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse('Unauthorized', 401);

    switch (operation) {
      case 'market_context':
      case 'multi_timeframe': {
        const symbols = data?.symbols || [];
        const timeframes = data?.timeframes || ['daily'];
        const forceRefresh = data?.force_refresh || false;

        if (symbols.length === 0) return errorResponse('Missing symbols');

        const results = [];
        for (const symbol of symbols) {
          const { data: structures } = await supabase
            .from('market_structure')
            .select('*')
            .eq('project_id', project_id)
            .eq('pair', symbol)
            .order('date', { ascending: false })
            .limit(5);

          const { data: trades } = await supabase
            .from('trade')
            .select('result, pnl, rr, direction, weekly_bias, daily_bias')
            .eq('project_id', project_id)
            .eq('pair', symbol)
            .is('deleted_at', null)
            .order('open_time', { ascending: false })
            .limit(20);

          const wins = (trades || []).filter((t: any) => t.result === 'WIN').length;
          const losses = (trades || []).filter((t: any) => t.result === 'LOSS').length;

          let analysis: Record<string, unknown> = {};
          if (openaiApiKey) {
            const context = `Symbol: ${symbol}\nTimeframes: ${timeframes.join(', ')}\nRecent structures: ${JSON.stringify(structures || [])}\nTrades: ${wins}W / ${losses}L`;
            const aiResp = await fetch(`${openaiBaseUrl}/chat/completions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{
                  role: 'system',
                  content: 'You are a market context analyst. Analyze market data and return JSON with keys: bias (bullish/bearish/neutral), strength (0-100), market_phase, trend, confidence_score (0-100), technical_summary, risk_assessment.'
                }, {
                  role: 'user',
                  content: context
                }],
                max_tokens: 1024,
                temperature: 0.3,
              }),
            });
            if (aiResp.ok) {
              const aiJson = await aiResp.json();
              analysis = JSON.parse(aiJson.choices[0].message.content);
            }
          }

          results.push({
            symbol,
            timeframe: timeframes[0],
            timestamp: new Date().toISOString(),
            bias: (analysis.bias as string) || 'neutral',
            strength: (analysis.strength as number) || 50,
            market_phase: (analysis.market_phase as string) || 'unknown',
            trend: (analysis.trend as string) || 'unknown',
            confidence_score: (analysis.confidence_score as number) || 50,
            technical_summary: (analysis.technical_summary as string) || '',
            risk_assessment: (analysis.risk_assessment as string) || '',
            support_levels: [],
            resistance_levels: [],
            key_events: [],
            news_sentiment: 'neutral',
            macro_context: '',
            raw_data: { structures: structures || [], recent_trades: trades || [] },
          });
        }
        return successResponse(results);
      }

      case 'analyze': {
        const symbols = data?.symbols || [];
        if (symbols.length === 0) return errorResponse('Missing symbols');

        const results = [];
        for (const symbol of symbols) {
          const { data: ms } = await supabase
            .from('market_structure')
            .select('*')
            .eq('project_id', project_id)
            .eq('pair', symbol)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: macroEvents } = await supabase
            .from('macro_event')
            .select('title, event_date, country, importance')
            .eq('country', symbol.substring(0, 2))
            .order('event_date', { ascending: false })
            .limit(5);

          results.push({
            symbol,
            timestamp: new Date().toISOString(),
            bias: ms?.weekly_bias || 'neutral',
            strength: 50,
            market_phase: ms?.market_phase || 'unknown',
            trend: ms?.trend || 'unknown',
            support_levels: [],
            resistance_levels: [],
            key_events: (macroEvents || []).map((e: any) => e.title),
            news_sentiment: 'neutral',
            macro_context: JSON.stringify(macroEvents || []),
            technical_summary: ms ? `Phase: ${ms.market_phase}, Trend: ${ms.trend}, Bias: ${ms.weekly_bias}/${ms.daily_bias}` : '',
            risk_assessment: 'Standard market risk applies',
            confidence_score: 60,
            raw_data: { market_structure: ms, macro_events: macroEvents || [] },
          });
        }
        return successResponse(results);
      }

      case 'trade_readiness': {
        const symbol = data?.symbol;
        if (!symbol) return errorResponse('Missing symbol');

        const { data: trades } = await supabase
          .from('trade')
          .select('result, pnl, rr, direction, weekly_bias, daily_bias')
          .eq('project_id', project_id)
          .eq('pair', symbol)
          .is('deleted_at', null)
          .order('open_time', { ascending: false })
          .limit(30);

        const wins = (trades || []).filter((t: any) => t.result === 'WIN').length;
        const total = (trades || []).length;
        const winRate = total > 0 ? (wins / total) * 100 : 0;

        const factors: string[] = [];
        if (winRate > 60) factors.push('Strong historical performance on this pair');
        else if (winRate > 40) factors.push('Moderate historical performance');
        else factors.push('Below-average historical performance');

        if (total >= 5) factors.push('Sufficient trade data for analysis');
        else factors.push('Limited trade history');

        let score = winRate;
        if (total < 3) score = Math.min(score, 30);

        return successResponse({
          ready: score >= 50,
          score: Math.round(score),
          factors,
        });
      }

      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});
