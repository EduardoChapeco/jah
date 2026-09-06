import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(__dirname, "../src/routes/_store.conta.classificados.novo.tsx");
let content = fs.readFileSync(targetFile, "utf8");

content = content.replace(/\r\n/g, "\n");

// Remover as linhas mal posicionadas
content = content.replace(
`                      <Banknote className="size-3.5 text-primary" />
                      <span>Dinheiro</span>
                    </div>
              </>
            )}
  </div>
  </div>`,
`                      <Banknote className="size-3.5 text-primary" />
                      <span>Dinheiro</span>
                    </div>
                  </div>
                </>
              )}
            </div>`
);

fs.writeFileSync(targetFile, content, "utf8");
console.log("Corrigido posicionamento do fragmento!");
