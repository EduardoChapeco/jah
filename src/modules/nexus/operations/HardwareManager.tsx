import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Cpu,
    Wifi,
    Rss,
    Plus,
    Trash2,
    Settings2,
    Activity,
    SignalHigh,
    BatteryMedium,
    Zap,
    Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function HardwareManager() {
    const { id: empresaId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [hwType, setHwType] = useState<"nfc" | "beacon">("nfc");

    // Simulated Fetch Hardware
    const { data: devices, isLoading } = useQuery({
        queryKey: ["hardware-devices", empresaId],
        queryFn: async () => {
            // Note: In a real system, we would have a 'hardware_devices' table
            // For now, let's assume we store them in a JSON field in company settings or similar, 
            // or just mock for the OS prototype.
            return [
                { id: 1, name: "Portal Entrada Sul", type: "nfc", serial: "NFC-8822-XP", status: "online", battery: 92, last_seen: "2 min ago" },
                { id: 2, name: "Beacon VIP Lounge", type: "beacon", serial: "BCN-4491-LT", status: "online", battery: 45, last_seen: "Just now" },
                { id: 3, name: "Scanner Staff A", type: "nfc", serial: "NFC-1102-SA", status: "offline", battery: 0, last_seen: "2 days ago" },
            ];
        }
    });

    const filteredDevices = devices?.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.serial.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Cpu className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-eventio-dark">Gestão de Hardware</h1>
                        <p className="text-muted-foreground">
                            Configure e monitore dispositivos NFC e Beacons em tempo real.
                        </p>
                    </div>
                </div>
                <Button
                    className="bg-eventio-dark hover:bg-eventio-dark/90 text-white rounded-lg h-12"
                    onClick={() => setIsSheetOpen(true)}
                >
                    <Plus className="mr-2 h-4 w-4" /> Provisionar Dispositivo
                </Button>
            </div>

            {/* Health Status Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="rounded-lg border-border/60">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <Activity className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Dispositivos Ativos</p>
                            <p className="text-xl font-bold">12/14</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-lg border-border/60">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Wifi className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Leituras/Minuto</p>
                            <p className="text-xl font-bold">142</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-lg border-border/60">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <BatteryMedium className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Bateria Crítica</p>
                            <p className="text-xl font-bold text-amber-600">2</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-lg border-border/60">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Latência Média</p>
                            <p className="text-xl font-bold">42ms</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou serial..."
                        className="pl-8 rounded-lg h-10 border-border/60 focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Devices Table */}
            <Card className="rounded-lg border-border/60 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/5">
                        <TableRow>
                            <TableHead className="w-[300px]">Dispositivo</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Serial</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Bateria</TableHead>
                            <TableHead>Última Atividade</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-10 w-40 rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-30 rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-12 rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24 rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredDevices?.map((device) => (
                            <TableRow key={device.id} className="hover:bg-muted/5 transition-colors">
                                <TableCell className="font-semibold">{device.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {device.type === 'nfc' ? <Rss className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                                        <span className="capitalize text-xs">{device.type}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                        {device.serial}
                                    </code>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={device.status === 'online' ? 'default' : 'secondary'} className={
                                        device.status === 'online' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/10' : ''
                                    }>
                                        <div className={`h-1.5 w-1.5 rounded-sm mr-1.5 ${device.status === 'online' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                                        {device.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-2 bg-muted rounded-sm overflow-hidden">
                                            <div
                                                className={`h-full ${device.battery > 30 ? 'bg-green-500' : 'bg-amber-500'}`}
                                                style={{ width: `${device.battery}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold">{device.battery}%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{device.last_seen}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/5 hover:text-primary">
                                            <Settings2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-500/5 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Sheet for Provisioning Hardware */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle>Provisionar Dispositivo</SheetTitle>
                        <SheetDescription>
                            Adicione um novo hardware à rede W-OS para coleta de dados e controle de acesso.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 mt-8">
                        <div className="space-y-2">
                            <Label>Tipo de Dispositivo</Label>
                            <Select
                                value={hwType}
                                onValueChange={(v: any) => setHwType(v)}
                            >
                                <SelectTrigger className="rounded-lg">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                    <SelectItem value="nfc">NFC Reader (Portal/Handheld)</SelectItem>
                                    <SelectItem value="beacon">Beacon (Bluetooth LE)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Amigável</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Catraca Principal"
                                className="rounded-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="serial">Número de Série / UID</Label>
                            <Input
                                id="serial"
                                placeholder="XXXXXXXX-XXXX"
                                className="rounded-lg font-mono"
                            />
                        </div>

                        <div className="p-4 bg-muted/30 rounded-lg border border-dashed text-center">
                            <SignalHigh className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground">
                                Certifique-se de que o dispositivo está em modo de emparelhamento.
                            </p>
                        </div>

                        <SheetFooter className="pt-8">
                            <Button className="w-full bg-eventio-dark hover:bg-eventio-dark/90 text-white rounded-lg h-12">
                                Iniciar Emparelhamento
                            </Button>
                        </SheetFooter>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
