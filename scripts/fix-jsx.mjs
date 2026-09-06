import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(__dirname, "../src/routes/_store.conta.classificados.novo.tsx");
let content = fs.readFileSync(targetFile, "utf8");

// Normalizar CRLF para LF
content = content.replace(/\r\n/g, "\n");

// 1. Remover comentário duplicado antes de Desapego
content = content.replace(
  `              {/* Produto Digital & Downloads */}\n\n              {/* Desapego & Bens Físicos`,
  `              {/* Desapego & Bens Físicos`
);

// 2. Localizar onde a vaga termina
const targetSearch = `<span className="text-[10px] text-muted-foreground mt-1 pl-6">{method.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>`;

const targetReplacement = `<span className="text-[10px] text-muted-foreground mt-1 pl-6">{method.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}`;

if (content.includes(targetSearch)) {
  content = content.replace(targetSearch, targetReplacement);
  console.log("Vaga fechada com sucesso!");
} else {
  // Procura mais flexível
  console.log("Tentando match flexível...");
  const regex = /({method\.desc}<\/span>\s*<\/div>\s*\);\s*}\)\}\s*<\/div>\s*<\/div>)([\s\n]*{\/\* Produto Digital)/;
  if (regex.test(content)) {
    content = content.replace(regex, `$1\n                </div>\n              )}$2`);
    console.log("Match flexível teve sucesso!");
  } else {
    console.error("Não encontrou o trecho da vaga!");
  }
}

fs.writeFileSync(targetFile, content, "utf8");
console.log("Script de correção JSX executado!");
