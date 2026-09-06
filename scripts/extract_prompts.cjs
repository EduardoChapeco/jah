const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = path.join(process.env.USERPROFILE || 'C:\\Users\\Excelência Tour SMO', '.gemini', 'antigravity-ide', 'brain', '3faf76f9-8771-49a3-8cc0-018714b41434', '.system_generated', 'logs', 'transcript.jsonl');

async function extractUserPrompts() {
  if (!fs.existsSync(logPath)) {
    console.log('Log not found at:', logPath);
    return;
  }

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const userInputs = [];
  let index = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'USER_INPUT') {
        index++;
        userInputs.push({
          num: index,
          step_index: parsed.step_index,
          created_at: parsed.created_at,
          content: parsed.content
        });
      }
    } catch (err) {
      // ignore
    }
  }

  console.log(`Total user inputs found: ${userInputs.length}`);
  const lastN = userInputs.slice(-100);
  
  const outputPath = path.join(__dirname, 'last_user_prompts.json');
  fs.writeFileSync(outputPath, JSON.stringify(lastN, null, 2), 'utf8');
  console.log(`Wrote last ${lastN.length} user inputs to ${outputPath}`);
}

extractUserPrompts();
