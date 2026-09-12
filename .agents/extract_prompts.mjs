import fs from 'fs';
import readline from 'readline';

const transcriptPath = 'C:\\Users\\Excelência Tour SMO\\.gemini\\antigravity-ide\\brain\\ad8ccbb9-d54f-4e3a-9143-c0e09880d00e\\.system_generated\\logs\\transcript.jsonl';

async function extractUserPrompts() {
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const prompts = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT') {
        const text = typeof obj.content === 'string' ? obj.content : JSON.stringify(obj.content);
        prompts.push({
          step: obj.step_index,
          text: text
        });
      }
    } catch (e) {}
  }

  console.log(`Total user prompts found: ${prompts.length}`);
  // Let's summarize the key topics of recent prompts
  const recent = prompts.slice(-40);
  const summary = recent.map((p, idx) => {
    return `### Prompt ${prompts.length - 40 + idx + 1} (step ${p.step}):\n${p.text.slice(0, 500)}\n`;
  }).join('\n---\n');

  fs.writeFileSync('.agents/recent_prompts_summary.txt', summary, 'utf8');
  console.log('Wrote .agents/recent_prompts_summary.txt successfully.');
}

extractUserPrompts();
