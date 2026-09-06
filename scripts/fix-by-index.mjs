import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(__dirname, "../src/routes/_store.conta.classificados.novo.tsx");
let content = fs.readFileSync(targetFile, "utf8");

content = content.replace(/\r\n/g, "\n");
const lines = content.split("\n");

for (let i = 2150; i < lines.length && i < 2190; i++) {
  if (lines[i].includes("<span>Dinheiro</span>")) {
    console.log("Achou Dinheiro na linha:", i + 1);
    // Linhas a substituir: i+1, i+2, i+3, i+4
    // i: <span>Dinheiro</span>
    // i+1: </div>
    // i+2: </>
    // i+3: )}
    // i+4: </div>
    // i+5: </div>
    lines.splice(
      i + 1,
      5,
      "                    </div>",
      "                  </div>",
      "                </>",
      "              )}",
      "            </div>"
    );
    break;
  }
}

fs.writeFileSync(targetFile, lines.join("\n"), "utf8");
console.log("Linhas reordenadas com precisão cirúrgica!");
