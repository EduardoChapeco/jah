import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const novoPath = path.resolve(__dirname, "../src/routes/_store.conta.classificados.novo.tsx");
const idPath = path.resolve(__dirname, "../src/routes/_store.classificados.$id.tsx");
const indexPath = path.resolve(__dirname, "../src/routes/_store.classificados.index.tsx");
const imoveisPath = path.resolve(__dirname, "../src/routes/_store.imoveis.tsx");

console.log("=== INICIANDO REFATORAÇÃO DE DESIGN, LINGUAGEM COMERCIAL E TAGS ===");

// ── 1. REFATORAR NOVO CLASSIFICADO (_store.conta.classificados.novo.tsx) ──
let novo = fs.readFileSync(novoPath, "utf8");

// A. Eliminar comentário vazado
novo = novo.replace(/\/\* Section 2: Ficha Técnica Especializada & Mensuração Canônica \*\/\s*/g, "");

// B. Corrigir layout de grade e sticky top do preview
novo = novo.replace(
  'max-h-[calc(100vh-10rem)] overflow-y-auto pr-2 no-scrollbar',
  ''
);
novo = novo.replace('sticky top-20', 'sticky top-0');

// C. Título comercial amigável da Seção 2
novo = novo.replace(
  '<span className="text-sm font-bold text-foreground">2. Ficha Técnica & Parâmetros Especializados</span>',
  `<span className="text-sm font-bold text-foreground">
                    2. {niche.id === "imovel"
                      ? "Características & Comodidades do Imóvel"
                      : niche.id === "hospedagem"
                      ? "Comodidades & Regras da Hospedagem"
                      : niche.id === "veiculo"
                      ? "Ficha do Veículo & Opcionais"
                      : niche.id === "vaga"
                      ? "Detalhes da Vaga & Benefícios"
                      : niche.id === "servico"
                      ? "Detalhes do Atendimento & Diferenciais"
                      : "Especificações do Item & Garantia"}
                  </span>`
);

novo = novo.replace(
  'Preencha os parâmetros do nicho para habilitar filtros avançados, métricas e mensuração no portal.',
  `{niche.id === "imovel"
                    ? "Informe mobília, vagas, quartos e facilidades para valorizar seu anúncio na busca."
                    : niche.id === "hospedagem"
                    ? "Detalhes da estadia, horários de check-in e comodidades inclusas."
                    : niche.id === "veiculo"
                    ? "Quilometragem, combustível, câmbio e opcionais de fábrica."
                    : niche.id === "vaga"
                    ? "Regime de contratação, modelo de trabalho e benefícios oferecidos."
                    : niche.id === "servico"
                    ? "Modalidade de atendimento, área de cobertura e garantia do serviço."
                    : "Detalhes e estado de conservação do item anunciado."}`
);

novo = novo.replace(
  '<Badge variant="secondary" className="text-[10px] font-semibold bg-primary/15 text-primary border-primary/20">\n                    Modo Avançado\n                  </Badge>',
  `<Badge variant="secondary" className="text-[10px] font-semibold bg-primary/15 text-primary border-primary/20">
                    {niche.id === "imovel" ? "Comodidades" : niche.id === "veiculo" ? "Opcionais" : niche.id === "vaga" ? "Benefícios" : "Detalhes"}
                  </Badge>`
);

// D. Adicionar Mobília e Comodidades no bloco de Imóvel
const oldImovelBlock = `{niche.id === "imovel" && (
                <div className=" bg-card rounded-2xl p-5 space-y-4 ">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <HomeIcon className="size-4 text-primary" />
                    <span>2. Ficha Técnica do Imóvel</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Operação</Label>
                      <Select value={reDealType} onValueChange={(v: any) => setReDealType(v)}>
                        <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aluguel">Aluguel Mensal</SelectItem>
                          <SelectItem value="venda">Venda</SelectItem>
                          <SelectItem value="temporada">Temporada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Tipo de Imóvel</Label>
                      <Input
                        value={rePropertyType}
                        onChange={(e) => setRePropertyType(e.target.value)}
                        placeholder="Apartamento, Casa, etc."
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Área Útil (m²)</Label>
                      <Input
                        value={reAreaSqm}
                        onChange={(e) => setReAreaSqm(e.target.value)}
                        placeholder="75"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Quartos</Label>
                      <Input
                        value={reBedrooms}
                        onChange={(e) => setReBedrooms(e.target.value)}
                        placeholder="2"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Vagas Garagem</Label>
                      <Input
                        value={reParking}
                        onChange={(e) => setReParking(e.target.value)}
                        placeholder="1"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Condomínio (R$)</Label>
                      <CurrencyField
                        value={reCondoCents}
                        onChange={setReCondoCents}
                        placeholder="0,00"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">IPTU Mensal (R$)</Label>
                      <CurrencyField
                        value={reIptuCents}
                        onChange={setReIptuCents}
                        placeholder="0,00"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>
                </div>
              )}`;

const newImovelBlock = `{niche.id === "imovel" && (
                <div className="bg-card rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <HomeIcon className="size-4 text-primary" />
                    <span>2. Características & Facilidades do Imóvel</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Operação</Label>
                      <Select value={reDealType} onValueChange={(v: any) => setReDealType(v)}>
                        <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aluguel">Aluguel Mensal</SelectItem>
                          <SelectItem value="venda">Venda</SelectItem>
                          <SelectItem value="temporada">Temporada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Tipo de Imóvel</Label>
                      <Input
                        value={rePropertyType}
                        onChange={(e) => setRePropertyType(e.target.value)}
                        placeholder="Apartamento, Casa, Sobrado, Terreno..."
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Área Útil (m²)</Label>
                      <Input
                        value={reAreaSqm}
                        onChange={(e) => setReAreaSqm(e.target.value)}
                        placeholder="75"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Quartos</Label>
                      <Input
                        value={reBedrooms}
                        onChange={(e) => setReBedrooms(e.target.value)}
                        placeholder="2"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Vagas Garagem</Label>
                      <Input
                        value={reParking}
                        onChange={(e) => setReParking(e.target.value)}
                        placeholder="1"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                  </div>

                  {/* Estado de Mobília */}
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs text-foreground font-medium">Mobília do Imóvel</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Mobiliado", "Semi-mobiliado", "Sem mobília"].map((mob) => {
                        const active = reFurnished === mob;
                        return (
                          <button
                            key={mob}
                            type="button"
                            onClick={() => setReFurnished(mob)}
                            className={\`px-3 py-2 rounded-xl text-xs font-medium border transition-all \${
                              active
                                ? "bg-primary/15 border-primary text-primary font-bold shadow-xs"
                                : "bg-background border-border/80 text-muted-foreground hover:bg-muted/40"
                            }\`}
                          >
                            {active ? "✓ " : ""}{mob}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Condomínio (R$)</Label>
                      <CurrencyField
                        value={reCondoCents}
                        onChange={setReCondoCents}
                        placeholder="0,00"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">IPTU Mensal (R$)</Label>
                      <CurrencyField
                        value={reIptuCents}
                        onChange={setReIptuCents}
                        placeholder="0,00"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  {/* Comodidades e Facilidades Clicáveis */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-foreground font-medium">Comodidades & Facilidades do Imóvel</Label>
                      <span className="text-[11px] text-muted-foreground font-mono">{reAmenities.length} selecionada(s)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        "Mobiliado",
                        "Garagem Coberta",
                        "Aceita Pets",
                        "Ar-condicionado",
                        "Piscina",
                        "Churrasqueira",
                        "Varanda Gourmet",
                        "Elevador",
                        "Portaria 24h",
                        "Academia",
                        "Playground",
                        "Salão de Festas",
                        "Armários Embutidos",
                        "Gás Central",
                        "Aquecimento Solar",
                        "Área de Serviço",
                        "Vista Panorâmica",
                        "Cozinha Equipada",
                      ].map((amenity) => {
                        const active = reAmenities.includes(amenity);
                        return (
                          <div
                            key={amenity}
                            onClick={() => toggleItem(reAmenities, setReAmenities, amenity)}
                            className={\`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all \${
                              active
                                ? "border-primary/50 bg-primary/10 text-foreground font-semibold"
                                : "border-border/60 bg-background/50 text-muted-foreground hover:bg-muted/40"
                            }\`}
                          >
                            <Checkbox checked={active} />
                            <span className="truncate">{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}`;

novo = novo.replace(oldImovelBlock, newImovelBlock);

// E. Adicionar Opcionais no bloco de Veículo
const oldVeiculoBlock = `{niche.id === "veiculo" && (
                <div className=" bg-card rounded-2xl p-5 space-y-4 ">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <Car className="size-4 text-primary" />
                    <span>2. Ficha Técnica do Veículo</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Marca *</Label>
                      <Input
                        value={vehicleBrand}
                        onChange={(e) => setVehicleBrand(e.target.value)}
                        placeholder="Ex: Honda, Toyota, VW"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Modelo *</Label>
                      <Input
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="Ex: Civic, Corolla, Golf"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Ano Fab.</Label>
                      <Input
                        value={vehicleYearFab}
                        onChange={(e) => setVehicleYearFab(e.target.value)}
                        placeholder="2021"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Ano Mod.</Label>
                      <Input
                        value={vehicleYearModel}
                        onChange={(e) => setVehicleYearModel(e.target.value)}
                        placeholder="2022"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Km Atual</Label>
                      <Input
                        value={vehicleKm}
                        onChange={(e) => setVehicleKm(e.target.value)}
                        placeholder="45.000"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Câmbio</Label>
                      <Select value={vehicleTransmission} onValueChange={setVehicleTransmission}>
                        <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Automático">Automático</SelectItem>
                          <SelectItem value="CVT">CVT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Combustível</Label>
                      <Select value={vehicleFuel} onValueChange={setVehicleFuel}>
                        <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Flex">Flex (Álcool/Gasolina)</SelectItem>
                          <SelectItem value="Gasolina">Gasolina</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Híbrido">Híbrido</SelectItem>
                          <SelectItem value="Elétrico">Elétrico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}`;

const newVeiculoBlock = `{niche.id === "veiculo" && (
                <div className="bg-card rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <Car className="size-4 text-primary" />
                    <span>2. Ficha do Veículo & Opcionais</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Marca *</Label>
                      <Input
                        value={vehicleBrand}
                        onChange={(e) => setVehicleBrand(e.target.value)}
                        placeholder="Ex: Honda, Toyota, VW, BMW..."
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Modelo & Versão *</Label>
                      <Input
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="Ex: Civic 2.0 EXL, Corolla XEi..."
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Ano Fab.</Label>
                      <Input
                        value={vehicleYearFab}
                        onChange={(e) => setVehicleYearFab(e.target.value)}
                        placeholder="2021"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Ano Mod.</Label>
                      <Input
                        value={vehicleYearModel}
                        onChange={(e) => setVehicleYearModel(e.target.value)}
                        placeholder="2022"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Km Atual</Label>
                      <Input
                        value={vehicleKm}
                        onChange={(e) => setVehicleKm(e.target.value)}
                        placeholder="45.000"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Câmbio</Label>
                      <Select value={vehicleTransmission} onValueChange={setVehicleTransmission}>
                        <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Automático">Automático</SelectItem>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="CVT">CVT</SelectItem>
                          <SelectItem value="Automatizado">Automatizado / Dupla Embreagem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Combustível</Label>
                      <Select value={vehicleFuel} onValueChange={setVehicleFuel}>
                        <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Flex">Flex (Álcool/Gasolina)</SelectItem>
                          <SelectItem value="Gasolina">Gasolina</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Híbrido">Híbrido</SelectItem>
                          <SelectItem value="Elétrico">Elétrico 100%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Cor</Label>
                      <Input
                        value={vehicleColor}
                        onChange={(e) => setVehicleColor(e.target.value)}
                        placeholder="Ex: Preto, Prata, Branco..."
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  {/* Opcionais do Veículo Clicáveis */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-foreground font-medium">Opcionais & Diferenciais</Label>
                      <span className="text-[11px] text-muted-foreground font-mono">{vehicleFeatures.length} selecionado(s)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        "Ar-condicionado Digital",
                        "Direção Elétrica",
                        "Bancos em Couro",
                        "Teto Solar",
                        "Central Multimídia",
                        "Câmera de Ré",
                        "Sensor de Estacionamento",
                        "Rodas de Liga Leve",
                        "Freios ABS",
                        "Airbags Frontais e Laterais",
                        "Piloto Automático",
                        "Faróis em LED",
                        "Chave Presencial / Start-Stop",
                        "Único Dono",
                        "IPVA Pago",
                        "Manual & Chave Reserva",
                        "Garantia de Fábrica",
                        "Laudo Cautelar Aprovado",
                      ].map((feature) => {
                        const active = vehicleFeatures.includes(feature);
                        return (
                          <div
                            key={feature}
                            onClick={() => toggleItem(vehicleFeatures, setVehicleFeatures, feature)}
                            className={\`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all \${
                              active
                                ? "border-primary/50 bg-primary/10 text-foreground font-semibold"
                                : "border-border/60 bg-background/50 text-muted-foreground hover:bg-muted/40"
                            }\`}
                          >
                            <Checkbox checked={active} />
                            <span className="truncate">{feature}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}`;

novo = novo.replace(oldVeiculoBlock, newVeiculoBlock);

// F. Adicionar Bloco de Serviço Profissional
const servicoInsertTarget = '{/* Desapego & Bens Físicos Avançado (Microfase 77B) */}';
const servicoBlock = `{/* Serviço Profissional */}
              {niche.id === "servico" && (
                <div className="bg-card rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <Wrench className="size-4 text-primary" />
                    <span>2. Detalhes do Atendimento & Garantia</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Modalidade de Atendimento</Label>
                      <Select value={serviceModality} onValueChange={(v: any) => setServiceModality(v)}>
                        <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="presencial">Presencial no Local do Cliente</SelectItem>
                          <SelectItem value="domicilio">Atendimento a Domicílio</SelectItem>
                          <SelectItem value="remoto">Remoto / Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Tipo de Cobrança</Label>
                      <Select value={servicePricingType} onValueChange={(v: any) => setServicePricingType(v)}>
                        <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixo">Preço Fixo</SelectItem>
                          <SelectItem value="por_hora">Por Hora Trabalhada</SelectItem>
                          <SelectItem value="a_combinar">Sob Orçamento Técnico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Área de Cobertura / Região</Label>
                      <Input
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                        placeholder="Ex: Chapecó e raio de até 50km"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Tempo Médio / Estimativa</Label>
                      <Input
                        value={serviceDuration}
                        onChange={(e) => setServiceDuration(e.target.value)}
                        placeholder="Ex: 2 a 4 horas / 1 dia útil"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <Label className="text-xs text-foreground font-medium">Diferenciais do Profissional</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        "Orçamento Gratuito",
                        "Emite Nota Fiscal (PJ)",
                        "Garantia de 90 dias",
                        "Atendimento Emergencial",
                        "Profissional Certificado",
                        "Aceita Cartão & PIX",
                        "Materiais de 1ª Linha Inclusos",
                        "Atendimento aos Finais de Semana",
                      ].map((diff) => {
                        const active = reAmenities.includes(diff);
                        return (
                          <div
                            key={diff}
                            onClick={() => toggleItem(reAmenities, setReAmenities, diff)}
                            className={\`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all \${
                              active
                                ? "border-primary/50 bg-primary/10 text-foreground font-semibold"
                                : "border-border/60 bg-background/50 text-muted-foreground hover:bg-muted/40"
                            }\`}
                          >
                            <Checkbox checked={active} />
                            <span className="truncate">{diff}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              ` + servicoInsertTarget;

novo = novo.replace(servicoInsertTarget, servicoBlock);

// G. Atualizar a Prévia Lateral (Live Truthful Preview) para Imóveis, Veículos e Serviços
const oldPreviewImovel = `{niche.id === "imovel" && (
                <div className=" rounded-xl p-4 bg-muted/20 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Especificações do Imóvel
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Finalidade</span>
                      <span className="font-semibold capitalize">{reDealType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Área</span>
                      <span className="font-semibold font-mono">{reAreaSqm ? \`\${reAreaSqm} m²\` : "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Quartos</span>
                      <span className="font-semibold font-mono">{reBedrooms || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Vagas</span>
                      <span className="font-semibold font-mono">{reParking || "—"}</span>
                    </div>
                  </div>
                </div>
              )}`;

const newPreviewImovel = `{niche.id === "imovel" && (
                <div className="rounded-xl p-4 bg-muted/25 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <HomeIcon className="size-3.5 text-primary" />
                      <span>Especificações do Imóvel</span>
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-semibold text-primary">
                      {reFurnished || "Disponível"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="bg-background/80 p-2.5 rounded-lg border border-border/40 text-center">
                      <span className="text-muted-foreground block text-[10px]">Operação</span>
                      <span className="font-bold capitalize text-foreground">{reDealType}</span>
                    </div>
                    <div className="bg-background/80 p-2.5 rounded-lg border border-border/40 text-center">
                      <span className="text-muted-foreground block text-[10px]">Área Útil</span>
                      <span className="font-bold font-mono text-foreground">{reAreaSqm ? \`\${reAreaSqm} m²\` : "—"}</span>
                    </div>
                    <div className="bg-background/80 p-2.5 rounded-lg border border-border/40 text-center">
                      <span className="text-muted-foreground block text-[10px]">Quartos</span>
                      <span className="font-bold font-mono text-foreground">{reBedrooms || "—"}</span>
                    </div>
                    <div className="bg-background/80 p-2.5 rounded-lg border border-border/40 text-center">
                      <span className="text-muted-foreground block text-[10px]">Vagas Garagem</span>
                      <span className="font-bold font-mono text-foreground">{reParking || "—"}</span>
                    </div>
                  </div>

                  {(reCondoCents || reIptuCents) && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                      {reCondoCents && (
                        <span>Condomínio: <strong className="text-foreground">{formatMoney(reCondoCents)}</strong></span>
                      )}
                      {reIptuCents && (
                        <span>IPTU: <strong className="text-foreground">{formatMoney(reIptuCents)}</strong></span>
                      )}
                    </div>
                  )}

                  {reAmenities.length > 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-1.5">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                        Comodidades Inclusas
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {reAmenities.map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                            ✓ {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}`;

novo = novo.replace(oldPreviewImovel, newPreviewImovel);

// H. Prévia Veículo com Opcionais
const oldPreviewVeiculo = `{niche.id === "veiculo" && (
                <div className=" rounded-xl p-4 bg-muted/20 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Ficha Técnica Automotiva
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Marca/Modelo</span>
                      <span className="font-semibold">
                        {vehicleBrand} {vehicleModel}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Ano</span>
                      <span className="font-semibold font-mono">
                        {vehicleYearFab || "—"}/{vehicleYearModel || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Km</span>
                      <span className="font-semibold font-mono">
                        {vehicleKm ? \`\${vehicleKm} km\` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Câmbio</span>
                      <span className="font-semibold">{vehicleTransmission}</span>
                    </div>
                  </div>
                </div>
              )}`;

const newPreviewVeiculo = `{niche.id === "veiculo" && (
                <div className="rounded-xl p-4 bg-muted/25 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Car className="size-3.5 text-primary" />
                      <span>Ficha do Veículo</span>
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-semibold text-primary">
                      {vehicleTransmission}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="bg-background/80 p-2.5 rounded-lg border border-border/40 text-center">
                      <span className="text-muted-foreground block text-[10px]">Marca/Modelo</span>
                      <span className="font-bold text-foreground truncate block">
                        {vehicleBrand || "—"} {vehicleModel || ""}
                      </span>
                    </div>
                    <div className="bg-background/80 p-2.5 rounded-lg border border-border/40 text-center">
                      <span className="text-muted-foreground block text-[10px]">Ano</span>
                      <span className="font-bold font-mono text-foreground">
                        {vehicleYearFab || "—"}/{vehicleYearModel || "—"}
                      </span>
                    </div>
                    <div className="bg-background/80 p-2.5 rounded-lg border border-border/40 text-center">
                      <span className="text-muted-foreground block text-[10px]">Km</span>
                      <span className="font-bold font-mono text-foreground">
                        {vehicleKm ? \`\${vehicleKm} km\` : "—"}
                      </span>
                    </div>
                    <div className="bg-background/80 p-2.5 rounded-lg border border-border/40 text-center">
                      <span className="text-muted-foreground block text-[10px]">Combustível</span>
                      <span className="font-bold text-foreground">{vehicleFuel}</span>
                    </div>
                  </div>

                  {vehicleFeatures.length > 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-1.5">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                        Opcionais & Diferenciais
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {vehicleFeatures.map((feat) => (
                          <Badge key={feat} variant="secondary" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                            ✓ {feat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {niche.id === "servico" && (
                <div className="rounded-xl p-4 bg-muted/25 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Wrench className="size-3.5 text-primary" />
                      <span>Detalhes do Serviço</span>
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-semibold text-primary capitalize">
                      {serviceModality}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-background/80 p-2.5 rounded-lg border border-border/40">
                      <span className="text-muted-foreground block text-[10px]">Modalidade</span>
                      <span className="font-bold capitalize text-foreground">{serviceModality}</span>
                    </div>
                    <div className="bg-background/80 p-2.5 rounded-lg border border-border/40">
                      <span className="text-muted-foreground block text-[10px]">Cobertura</span>
                      <span className="font-bold text-foreground">{serviceArea || "Regional"}</span>
                    </div>
                  </div>
                  {reAmenities.length > 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-1.5">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                        Diferenciais Inclusos
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {reAmenities.map((diff) => (
                          <Badge key={diff} variant="secondary" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                            ✓ {diff}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}`;

novo = novo.replace(oldPreviewVeiculo, newPreviewVeiculo);

fs.writeFileSync(novoPath, novo);
console.log("✓ _store.conta.classificados.novo.tsx refatorado com sucesso!");

// ── 2. REFATORAR PÁGINA DE DETALHES (_store.classificados.$id.tsx) ──
let idContent = fs.readFileSync(idPath, "utf8");

// Remover jargões acadêmicos e AI-smell
idContent = idContent.replace(/Mensuração & Análise de Aderência/g, "Requisitos & Perfil da Oportunidade");
idContent = idContent.replace(/Padrão InfoJobs \/ LinkedIn/g, "Critérios de Seleção");
idContent = idContent.replace(/Esta oportunidade mensura candidatos por competências e escolaridade canônica\. Candidatos com formação equivalente ou superior têm alta prioridade de triagem\./g, "Candidatos que atendem aos requisitos de formação e competências têm maior compatibilidade com esta vaga.");

// Inserir renderização completa de Imóveis & Hospedagem na página de detalhes
const imovelDetailBlock = `{/* ─── Especificações de Imóvel (Casas, Aptos, Temporada) ─── */}
              {classified.category === "real_estate" && (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Tag className="size-3.5 text-primary" />
                      <span>Características & Facilidades do Imóvel</span>
                    </h3>
                    {classified.attributes?.furnished && (
                      <Badge variant="secondary" className="text-[11px] font-semibold bg-primary/15 text-primary border-primary/20">
                        {classified.attributes.furnished}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {classified.bedrooms && (
                      <div className="bg-muted/30 p-3 rounded-xl border border-border/40 text-center">
                        <span className="text-muted-foreground block text-[10px]">Quartos</span>
                        <span className="font-bold text-base text-foreground font-mono">{classified.bedrooms}</span>
                      </div>
                    )}
                    {classified.parking_spots && (
                      <div className="bg-muted/30 p-3 rounded-xl border border-border/40 text-center">
                        <span className="text-muted-foreground block text-[10px]">Vagas de Garagem</span>
                        <span className="font-bold text-base text-foreground font-mono">{classified.parking_spots}</span>
                      </div>
                    )}
                    {classified.bathrooms && (
                      <div className="bg-muted/30 p-3 rounded-xl border border-border/40 text-center">
                        <span className="text-muted-foreground block text-[10px]">Banheiros</span>
                        <span className="font-bold text-base text-foreground font-mono">{classified.bathrooms}</span>
                      </div>
                    )}
                    {classified.area_sqm && (
                      <div className="bg-muted/30 p-3 rounded-xl border border-border/40 text-center">
                        <span className="text-muted-foreground block text-[10px]">Área Útil</span>
                        <span className="font-bold text-base text-foreground font-mono">{classified.area_sqm} m²</span>
                      </div>
                    )}
                  </div>

                  {(classified.attributes?.condo_cents || classified.attributes?.iptu_cents) && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/20 p-3 rounded-xl">
                      {classified.attributes?.condo_cents && (
                        <span>Condomínio: <strong className="text-foreground">{formatMoney(classified.attributes.condo_cents)}</strong></span>
                      )}
                      {classified.attributes?.iptu_cents && (
                        <span>IPTU: <strong className="text-foreground">{formatMoney(classified.attributes.iptu_cents)}</strong></span>
                      )}
                    </div>
                  )}

                  {/* Comodidades do Imóvel com Tags Visuais */}
                  {Array.isArray(classified.amenities || classified.attributes?.amenities) && (classified.amenities || classified.attributes?.amenities).length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block">
                        Comodidades & Lazer
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(classified.amenities || classified.attributes?.amenities).map((amenity: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs font-semibold px-2.5 py-1 rounded-lg gap-1.5 bg-primary/10 text-primary border-primary/20">
                            ✓ {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}`;

const targetIdLocation = '{/* Ficha Técnica de Veículo */}';
if (!idContent.includes('Características & Facilidades do Imóvel')) {
  idContent = idContent.replace(targetIdLocation, imovelDetailBlock + "\n\n              " + targetIdLocation);
}

fs.writeFileSync(idPath, idContent);
console.log("✓ _store.classificados.$id.tsx refatorado com sucesso!");

// ── 3. REFATORAR VITRINES (_store.classificados.index.tsx) ──
let indexContent = fs.readFileSync(indexPath, "utf8");

// Adicionar tags contextuais de imóveis/veículos dentro dos cards na listagem
const oldCardTitleBlock = `<h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {item.title}
                </h3>`;

const newCardTitleBlock = `<h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {item.title}
                </h3>

                {/* Chips de Facilidades Rápidas (Ex: Mobiliado, 2 Quartos, Automático) */}
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {item.category === "real_estate" && (
                    <>
                      {item.attributes?.furnished && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                          {item.attributes.furnished}
                        </span>
                      )}
                      {item.bedrooms && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground">
                          {item.bedrooms} qtos
                        </span>
                      )}
                      {item.parking_spots && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground">
                          {item.parking_spots} vg
                        </span>
                      )}
                      {item.area_sqm && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground font-mono">
                          {item.area_sqm} m²
                        </span>
                      )}
                    </>
                  )}
                  {item.category === "vehicle" && (
                    <>
                      {item.attributes?.transmission && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                          {item.attributes.transmission}
                        </span>
                      )}
                      {item.attributes?.year_fab && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground font-mono">
                          {item.attributes.year_fab}
                        </span>
                      )}
                      {item.attributes?.mileage_km && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground font-mono">
                          {item.attributes.mileage_km} km
                        </span>
                      )}
                    </>
                  )}
                  {item.category === "job" && (
                    <>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                        {item.attributes?.regime || "CLT"}
                      </span>
                      {item.attributes?.work_model && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground capitalize">
                          {item.attributes.work_model}
                        </span>
                      )}
                    </>
                  )}
                </div>`;

indexContent = indexContent.replace(oldCardTitleBlock, newCardTitleBlock);
fs.writeFileSync(indexPath, indexContent);
console.log("✓ _store.classificados.index.tsx refatorado com tags comerciais nos cards!");

console.log("=== REFATORAÇÃO CONCLUÍDA COM SUCESSO! ===");
