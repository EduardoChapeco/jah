import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(__dirname, "../src/routes/_store.conta.classificados.novo.tsx");
let content = fs.readFileSync(targetFile, "utf8");

content = content.replace(/\r\n/g, "\n");

const target = `                    <div className="flex items-center gap-1.5 text-xs font-medium select-none">
                      <Banknote className="size-3.5 text-primary" />
                      <span>Dinheiro</span>
                    </div>
                  </div>
                </div>`;

const replacement = `                    <div className="flex items-center gap-1.5 text-xs font-medium select-none">
                      <Banknote className="size-3.5 text-primary" />
                      <span>Dinheiro</span>
                    </div>
                  </div>
                </>
              )}
            </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(targetFile, content, "utf8");
  console.log("Fragmento fechado com sucesso!");
} else {
  console.error("Não encontrou o target!");
}
