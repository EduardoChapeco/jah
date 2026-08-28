import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

async function deleteDeployment(id) {
  try {
    await execAsync(`npx wrangler pages deployment delete ${id} --project-name jah -f`);
    console.log(`✓ Deletado: ${id}`);
  } catch (err) {
    // ignorar se for a ativa
  }
}

async function main() {
  console.log("=== Limpando TODOS os Deployments Restantes do Projeto 'jah' ===");

  let loop = 0;
  while (loop < 25) {
    loop++;
    try {
      const { stdout } = await execAsync("npx wrangler pages deployment list --project-name jah");
      const matches = stdout.match(uuidRegex);
      const unique = Array.from(new Set(matches || []));

      if (unique.length <= 1) {
        console.log("Restou apenas 1 ou nenhum deployment.");
        break;
      }

      console.log(`\nLote ${loop}: Deletando ${unique.length} deployments concorrentemente...`);
      // Deletar em lotes de 10 concorrentes
      for (let i = 0; i < unique.length; i += 10) {
        const batch = unique.slice(i, i + 10);
        await Promise.allSettled(batch.map((id) => deleteDeployment(id)));
      }
    } catch (err) {
      console.warn("Erro ao listar:", err.message);
      break;
    }
  }

  console.log("\n=== Deletando o Projeto 'jah' ===");
  try {
    const { stdout } = await execAsync("npx wrangler pages project delete jah --yes");
    console.log(stdout);
    console.log("Projeto 'jah' apagado com sucesso do Cloudflare Pages!");
  } catch (err) {
    console.log("Resultado final:", err.message);
  }
}

main();
