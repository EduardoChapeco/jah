import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { INITIAL_PROFESSIONALS, formatCurrency } from "./logistics-data";

const MOCK_FINANCIAL = INITIAL_PROFESSIONALS.map((p, i) => ({
  id: p.id,
  name: p.name,
  trips: [28, 35, 22][i] || 15,
  revenue: [4200, 5100, 3800][i] || 2000,
  commissionPct: 80,
  status: i === 2 ? "pending" : "paid",
}));

export function FinancialSection() {
  const [period, setPeriod] = useState("month");

  const totalRevenue = MOCK_FINANCIAL.reduce((s, f) => s + f.revenue, 0);
  const totalCommissions = MOCK_FINANCIAL.reduce((s, f) => s + f.revenue * (f.commissionPct / 100), 0);
  const operatingCosts = 5800;
  const netProfit = totalRevenue - totalCommissions - operatingCosts;

  const kpis = [
    { label: "Receita Total", value: formatCurrency(totalRevenue) },
    { label: "Comissões", value: formatCurrency(totalCommissions) },
    { label: "Custos Operacionais", value: formatCurrency(operatingCosts) },
    { label: "Lucro Líquido", value: formatCurrency(netProfit) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Financeiro</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="quarter">Trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-xl font-bold mt-1">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Extrato por Profissional</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead className="text-center">Corridas</TableHead>
                <TableHead className="text-right">Faturado</TableHead>
                <TableHead className="text-right">Comissão ({MOCK_FINANCIAL[0]?.commissionPct}%)</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_FINANCIAL.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="text-center">{f.trips}</TableCell>
                  <TableCell className="text-right">{formatCurrency(f.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(f.revenue * (f.commissionPct / 100))}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={f.status === "paid" ? "default" : "secondary"}>
                      {f.status === "paid" ? "Pago" : "Pendente"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
