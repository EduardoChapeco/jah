/**
 * Thermal Printer Engine — ESC/POS & ZPL Raw Byte Generator
 * Padrão industrial para impressoras térmicas de recibos (58mm / 80mm) e etiquetas de envio (100x150mm).
 * Suporte a Web Serial API e Web Bluetooth API para despacho direto sem caixa de diálogo do SO.
 */

// ---------------------------------------------------------------------------
// 1. GERADOR DE BYTES ESC/POS (RECIBOS 58mm / 80mm)
// ---------------------------------------------------------------------------

export interface EscPosReceiptData {
  storeName: string;
  storeCnpj?: string;
  storeAddress?: string;
  orderNumber: string;
  orderDate: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    qty: number;
    priceCents: number;
    options?: string[];
  }>;
  subtotalCents: number;
  deliveryFeeCents?: number;
  discountCents?: number;
  totalCents: number;
  paymentMethod: string;
  channelSource?: string;
  notes?: string;
  qrCodeUrl?: string;
  width?: "58mm" | "80mm";
}

export class EscPosBuilder {
  private buffer: number[] = [];
  private charsPerLine: number = 48; // Padrão 80mm (32 para 58mm)

  constructor(width: "58mm" | "80mm" = "80mm") {
    this.charsPerLine = width === "58mm" ? 32 : 48;
    this.init();
  }

  // Inicializa a impressora (ESC @)
  init(): this {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  // Alinhamento: 0=Esquerda, 1=Centro, 2=Direita (ESC a n)
  align(alignment: "left" | "center" | "right"): this {
    const n = alignment === "center" ? 1 : alignment === "right" ? 2 : 0;
    this.buffer.push(0x1b, 0x61, n);
    return this;
  }

  // Negrito (ESC E n)
  bold(enable: boolean): this {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  // Tamanho do texto: double-height e double-width (GS ! n)
  size(size: "normal" | "large" | "extra-large"): this {
    if (size === "extra-large") {
      this.buffer.push(0x1d, 0x21, 0x22); // 3x altura, 3x largura
    } else if (size === "large") {
      this.buffer.push(0x1d, 0x21, 0x11); // 2x altura, 2x largura
    } else {
      this.buffer.push(0x1d, 0x21, 0x00); // 1x normal
    }
    return this;
  }

  // Adiciona texto simples
  text(str: string): this {
    const cleanStr = this.sanitizeText(str);
    for (let i = 0; i < cleanStr.length; i++) {
      this.buffer.push(cleanStr.charCodeAt(i));
    }
    return this;
  }

  // Linha com quebra (LF)
  line(str: string = ""): this {
    this.text(str);
    this.buffer.push(0x0a);
    return this;
  }

  // Linha horizontal divisória
  separator(char: string = "-"): this {
    return this.line(char.repeat(this.charsPerLine));
  }

  // Linha formatada com texto na esquerda e texto na direita (ex: Nome do Item ..... R$ 25,00)
  row(left: string, right: string): this {
    const maxLeftLen = this.charsPerLine - right.length - 1;
    let safeLeft = left;
    if (safeLeft.length > maxLeftLen) {
      safeLeft = safeLeft.substring(0, maxLeftLen - 2) + "..";
    }
    const spaces = Math.max(1, this.charsPerLine - safeLeft.length - right.length);
    return this.line(safeLeft + " ".repeat(spaces) + right);
  }

  // Código de Barras CODE128 (GS k 73 len data)
  barcode128(data: string): this {
    this.align("center");
    // Configura altura (GS h n)
    this.buffer.push(0x1d, 0x68, 60);
    // Configura largura da barra (GS w n)
    this.buffer.push(0x1d, 0x77, 2);
    // HRI caracteres embaixo (GS H 2)
    this.buffer.push(0x1d, 0x48, 2);
    // Comando Code128
    const bytes = Array.from(data).map((c) => c.charCodeAt(0));
    this.buffer.push(0x1d, 0x6b, 73, bytes.length, ...bytes);
    this.line();
    return this;
  }

  // QR Code ESC/POS padrão modelo 2
  qrCode(content: string): this {
    this.align("center");
    const bytes = Array.from(content).map((c) => c.charCodeAt(0));
    const len = bytes.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // 1. Armazena dados do QR Code no buffer da impressora
    this.buffer.push(0x1d, 0x28, 0x6b, pL, pH, 49, 80, 48, ...bytes);
    // 2. Define tamanho do módulo (tamanho 4)
    this.buffer.push(0x1d, 0x28, 0x6b, 3, 0, 49, 67, 4);
    // 3. Imprime o QR Code armazenado
    this.buffer.push(0x1d, 0x28, 0x6b, 3, 0, 49, 81, 48);
    this.line();
    return this;
  }

  // Alimentação de papel e corte de guilhotina (GS V A n)
  cut(): this {
    this.buffer.push(0x0a, 0x0a, 0x0a, 0x0a); // Avanço de 4 linhas
    this.buffer.push(0x1d, 0x56, 0x41, 0x00); // Corte total
    return this;
  }

  // Converte texto acentuado para ASCII compatível com CP850/CP1252
  private sanitizeText(str: string): string {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^\x20-\x7E\n\r]/g, ""); // apenas ascii imprimível
  }

  // Retorna o array binário pronto para transmissão
  toBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Constrói o fluxo de bytes ESC/POS de um pedido pronto para impressão
 */
export function buildEscPosReceipt(data: EscPosReceiptData): Uint8Array {
  const b = new EscPosBuilder(data.width || "80mm");

  // Cabeçalho da Loja
  b.align("center");
  b.bold(true).size("large").line(data.storeName).size("normal").bold(false);
  if (data.storeCnpj) b.line(`CNPJ: ${data.storeCnpj}`);
  if (data.storeAddress) b.line(data.storeAddress);
  b.separator("=");

  // Informações do Pedido
  b.align("left");
  b.bold(true).size("large").line(`PEDIDO #${data.orderNumber}`).size("normal").bold(false);
  b.line(`Data: ${data.orderDate}`);
  if (data.channelSource) {
    b.bold(true).line(`CANAL: ${data.channelSource.toUpperCase()}`).bold(false);
  }
  if (data.customerName) {
    b.line(`Cliente: ${data.customerName}`);
    if (data.customerPhone) b.line(`Tel: ${data.customerPhone}`);
  }
  b.separator("-");

  // Lista de Itens
  b.bold(true).row("ITEM", "TOTAL").bold(false);
  b.separator("-");

  for (const item of data.items) {
    const itemPriceFormatted = (item.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    b.bold(true).row(`${item.qty}x ${item.name}`, itemPriceFormatted).bold(false);
    if (item.options && item.options.length > 0) {
      for (const opt of item.options) {
        b.line(`  + ${opt}`);
      }
    }
  }

  b.separator("-");

  // Totais Financeiros
  const formatBrl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  b.row("Subtotal:", formatBrl(data.subtotalCents));
  if (data.deliveryFeeCents && data.deliveryFeeCents > 0) {
    b.row("Taxa de Entrega:", formatBrl(data.deliveryFeeCents));
  }
  if (data.discountCents && data.discountCents > 0) {
    b.row("Desconto:", `-${formatBrl(data.discountCents)}`);
  }

  b.separator("=");
  b.bold(true).size("large").row("TOTAL:", formatBrl(data.totalCents)).size("normal").bold(false);
  b.separator("=");

  b.line(`Forma de Pagamento: ${data.paymentMethod}`);

  if (data.notes) {
    b.separator("-");
    b.bold(true).line("OBSERVACOES:").bold(false);
    b.line(data.notes);
  }

  // Código de Barras e QR Code
  b.separator("-");
  b.barcode128(data.orderNumber);

  if (data.qrCodeUrl) {
    b.line();
    b.qrCode(data.qrCodeUrl);
    b.align("center").line("Escaneie para acompanhar o pedido");
  }

  b.align("center").line("Obrigado pela preferencia!").line("Waesy Platform");

  b.cut();
  return b.toBytes();
}

// ---------------------------------------------------------------------------
// 2. GERADOR ZPL (ETIQUETAS TÉRMICAS ADESIVAS 100x150mm)
// ---------------------------------------------------------------------------

export interface ZplShippingLabelData {
  carrierName: string;
  serviceType: string;
  trackingNumber: string;
  orderNumber: string;
  batchCode?: string;
  recipient: {
    name: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
  };
  sender: {
    storeName: string;
    city: string;
    state: string;
    zipCode: string;
  };
  channelSource?: string;
  totalItemsCount: number;
  weightGrams?: number;
}

/**
 * Gera script ZPL padrão industrial (Zebra) para etiqueta de 100x150mm (800x1200 dots @ 203 DPI)
 */
export function buildZplShippingLabel(data: ZplShippingLabelData): string {
  const clean = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\^~]/g, "");

  return `^XA
^PW800
^LL1200
^LH0,0

// Moldura externa
^FO20,20^GB760,1160,3^FS

// Cabeçalho da Transportadora
^FO30,35^A0N,45,45^FD${clean(data.carrierName.toUpperCase())}^FS
^FO550,35^A0N,40,40^FD${clean(data.serviceType.toUpperCase())}^FS
^FO20,95^GB760,2,2^FS

// Código de Barras de Rastreio (CODE128)
^FO60,120^BY3,3,100^BCN,100,Y,N,N^FD${clean(data.trackingNumber)}^FS
^FO20,270^GB760,2,2^FS

// Bloco do Destinatário
^FO30,285^A0N,28,28^FDDESTINATARIO:^FS
^FO30,325^A0N,36,36^FD${clean(data.recipient.name.toUpperCase())}^FS
^FO30,375^A0N,30,30^FD${clean(data.recipient.street)}, ${clean(data.recipient.number)}${data.recipient.complement ? " - " + clean(data.recipient.complement) : ""}^FS
^FO30,415^A0N,30,30^FD${clean(data.recipient.neighborhood)}^FS
^FO30,455^A0N,32,32^FD${clean(data.recipient.city)} - ${clean(data.recipient.state)}^FS
^FO30,500^A0N,45,45^FDCEP: ${clean(data.recipient.zipCode)}^FS
${data.recipient.phone ? `^FO30,555^A0N,26,26^FDTel: ${clean(data.recipient.phone)}^FS` : ""}
^FO20,600^GB760,2,2^FS

// Bloco de Dados do Pedido e Canal
^FO30,620^A0N,26,26^FDPEDIDO: #${clean(data.orderNumber)}^FS
${data.batchCode ? `^FO450,620^A0N,26,26^FDLOTE: ${clean(data.batchCode)}^FS` : ""}
${data.channelSource ? `^FO30,660^A0N,28,28^FDCANAL: ${clean(data.channelSource.toUpperCase())}^FS` : ""}
^FO450,660^A0N,26,26^FDVOLUMES: 1 / 1^FS
^FO20,710^GB760,2,2^FS

// Bloco do Remetente
^FO30,730^A0N,24,24^FDREMETENTE:^FS
^FO30,765^A0N,28,28^FD${clean(data.sender.storeName.toUpperCase())}^FS
^FO30,800^A0N,26,26^FD${clean(data.sender.city)} - ${clean(data.sender.state)} | CEP: ${clean(data.sender.zipCode)}^FS
^FO20,845^GB760,2,2^FS

// QR Code com dados unificados
^FO550,865^BQN,2,6^FDQA,${clean(data.trackingNumber)}^FS
^FO30,880^A0N,26,26^FDCONTEUDO: ${data.totalItemsCount} ITENS DIVERSOS^FS
${data.weightGrams ? `^FO30,920^A0N,26,26^FDPESO APROX: ${data.weightGrams}g^FS` : ""}
^FO30,960^A0N,22,22^FDWIDER PLATFORM - LOGISTICA HIPERLOCAL^FS

^XZ`;
}

// ---------------------------------------------------------------------------
// 3. HARDWARE TRANSPORTERS (WEB SERIAL & BLUETOOTH)
// ---------------------------------------------------------------------------

/**
 * Envia fluxo de bytes binários diretamente para impressora conectada via porta Serial USB
 */
export async function sendBytesToSerialPrinter(bytes: Uint8Array, baudRate: number = 9600): Promise<{ success: boolean; message: string }> {
  if (typeof navigator === "undefined" || !("serial" in navigator)) {
    throw new Error("A Web Serial API não é suportada por este navegador. Utilize o Google Chrome, Edge ou Opera.");
  }

  try {
    // @ts-ignore Web Serial API
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate });

    const writer = port.writable.getWriter();
    await writer.write(bytes);
    writer.releaseLock();
    await port.close();

    return { success: true, message: "Bytes enviados com sucesso para a impressora serial!" };
  } catch (err: any) {
    if (err.name === "NotFoundError") {
      throw new Error("Nenhuma porta serial foi selecionada.");
    }
    throw new Error("Falha ao comunicar com a impressora serial: " + err.message);
  }
}

/**
 * Envia string de comando ZPL diretamente para a impressora serial
 */
export async function sendZplToSerialPrinter(zpl: string, baudRate: number = 9600): Promise<{ success: boolean; message: string }> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(zpl);
  return sendBytesToSerialPrinter(bytes, baudRate);
}
