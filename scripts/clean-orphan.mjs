import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(__dirname, "../src/routes/_store.conta.classificados.novo.tsx");
let content = fs.readFileSync(targetFile, "utf8");

// Procurar o trecho duplicado entre a linha 642 e 677
const targetSnippet = `  // Specialized: Serviço
  const [serviceModality, setServiceModality] = useState<"presencial" | "remoto" | "domicilio">(
  "presencial",
  );
  const [serviceArea, setServiceArea] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");
  const [servicePricingType, setServicePricingType] = useState<"fixo" | "por_hora" | "a_combinar">(
  "fixo",
  );

  rental_period: niche.id === "hospedagem" ? "diaria" : undefined,
  negotiable,
  whatsapp: whatsapp.trim() || undefined,
  contact_whatsapp: whatsapp.trim() || undefined,
  location_name: locationName.trim() || undefined,
  images: images,
  attributes,
  status: "active",
  },
  });

  toast.success("Anúncio publicado com sucesso!");
  await Promise.all([
  queryClient.invalidateQueries({ queryKey: ["classifieds-master-list"] }),
  queryClient.invalidateQueries({ queryKey: ["classifieds"] }),
  ]).catch(() => null);
  navigate({ to: "/classificados/$id", params: { id: res.id } });
  } catch (err: any) {
  console.error("Erro ao publicar classificado:", err);
  toast.error(err?.message || "Erro ao publicar anúncio.");
  } finally {
  setIsSubmitting(false);
  }
  };`;

// Normalizar CRLF para LF
const normalizedContent = content.replace(/\r\n/g, "\n");
const lines = normalizedContent.split("\n");

// Achar a linha com rental_period: niche.id === "hospedagem" e remover o bloco duplicado
console.log("Total lines:", lines.length);
let startIdx = -1;
let endIdx = -1;

for (let i = 600; i < lines.length; i++) {
  if (lines[i].includes("// Specialized: Serviço") && i > 630) {
    startIdx = i;
  }
  if (startIdx !== -1 && lines[i].includes("const parsedPriceCents = priceCents ?? null;")) {
    endIdx = i;
    break;
  }
}

console.log("Found startIdx:", startIdx, "endIdx:", endIdx);
if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx);
  fs.writeFileSync(targetFile, lines.join("\n"), "utf8");
  console.log("Linhas duplicadas removidas com sucesso!");
} else {
  console.error("Não encontrou o bloco!");
}
