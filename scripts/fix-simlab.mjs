import fs from 'fs';

let code = fs.readFileSync('src/services/simlab.functions.ts', 'utf8');

// 1. Fix import
code = code.replace(
  "import { getServerClient } from '@/lib/supabase';",
  "import { supabase, getServerClient } from '@/lib/supabase';"
);

// 2. Fix evaluateBatchWithRealAI mapping
const oldMapping = `      return personas.map(arch => {
        const aiEval = evaluationsMap.get(arch.id) as any;
        return {
          id: 'resp-' + arch.id + '-' + Date.now(),
          persona_id: arch.id,
          persona_name: arch.display_name,
          interest_score: Number(aiEval?.interest_score || 7),
          purchase_intent_pct: Number(aiEval?.purchase_intent_pct || 60),
          system1_emotion: (aiEval?.system1_emotion || 'desejo') as System1Emotion,
          price_perception: (aiEval?.price_perception || 'justo') as PricePerception,
          key_objection: aiEval?.objection || 'Nenhuma barreira grave detectada.',
          verbatim_quote: aiEval?.quote || \`\${arch.display_name.split(' ')[0]}: "A proposta parece boa pelo preço ofertado."\`,
          break_even_price_brl: Number((stimulus.test_price_brl || 85) * (0.8 + ((arch.cynicism_index || 5) / 25))),
        };
      });`;

const newMapping = `      return personas.map(arch => {
        const aiEval = evaluationsMap.get(arch.id) as any;
        return {
          id: 'resp-' + arch.id + '-' + Date.now(),
          experiment_id: stimulus?.experiment_id || 'exp-batch',
          archetype_id: arch.id,
          archetype: arch,
          interest_score: Number(aiEval?.interest_score || 7),
          purchase_intent_percent: Number(aiEval?.purchase_intent_pct || 60),
          system_1_emotion: (aiEval?.system1_emotion || 'desejo') as System1Emotion,
          price_perception: (aiEval?.price_perception || 'justo') as PricePerception,
          primary_barrier_objection: aiEval?.objection || 'Nenhuma barreira grave detectada.',
          verbatim_reaction: aiEval?.quote || \`\${arch.display_name.split(' ')[0]}: "A proposta parece boa pelo preço ofertado."\`,
          simulated_at: new Date().toISOString(),
        };
      });`;

code = code.replace(oldMapping, newMapping);

// 3. Fix expRow scope in executeSimLabBatchSimulation
const oldExpBlock = `  let testPrice = 85.0;
  try {
    const { data: expRow } = await supabase
      .from('simlab_market_experiments')
      .select('stimulus_payload')
      .eq('id', data.experimentId)
      .maybeSingle();

    if (expRow?.stimulus_payload?.test_price_brl) {
      testPrice = Number(expRow.stimulus_payload.test_price_brl);
    }
  } catch (e: any) {
    console.warn('[simlab] Leitura de experimento:', e.message);
  }`;

const newExpBlock = `  let testPrice = 85.0;
  let expRow: any = null;
  try {
    const res = await supabase
      .from('simlab_market_experiments')
      .select('*')
      .eq('id', data.experimentId)
      .maybeSingle();
    expRow = res.data;

    if (expRow?.stimulus_payload?.test_price_brl) {
      testPrice = Number(expRow.stimulus_payload.test_price_brl);
    }
  } catch (e: any) {
    console.warn('[simlab] Leitura de experimento:', e.message);
  }`;

code = code.replace(oldExpBlock, newExpBlock);

// 4. Fix executeRunSimLabBatchSimulation
code = code.replace(
  /return executeRunSimLabBatchSimulation\(\{[\s\S]*?\}\);/,
  "return executeSimLabBatchSimulation({ experimentId: 'temp-' + Date.now(), storeId: 'default' });"
);

fs.writeFileSync('src/services/simlab.functions.ts', code, 'utf8');
console.log('simlab.functions.ts updated successfully via script');
