import { useState } from "react";
import { toast } from "sonner";
import { Save, Plus, Trash2, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { saveWorkingHours, WorkingHours, Weekday, TimeInterval } from "@/services/store.functions";

const DAYS_MAP: Record<Weekday, string> = {
  mon: "Segunda-feira",
  tue: "Terça-feira",
  wed: "Quarta-feira",
  thu: "Quinta-feira",
  fri: "Sexta-feira",
  sat: "Sábado",
  sun: "Domingo",
};

const DAYS_ORDER: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function WorkingHoursEditor({ initialData }: { initialData: WorkingHours }) {
  const [schedule, setSchedule] = useState<WorkingHours>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveWorkingHours({ data: schedule });
      toast.success("Horários salvos com sucesso!");
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao salvar horários");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day: Weekday) => {
    setSchedule((prev) => {
      const open = !prev[day].open;
      const intervals =
        open && prev[day].intervals.length === 0
          ? [{ from: "09:00", to: "18:00" }]
          : prev[day].intervals;
      return { ...prev, [day]: { ...prev[day], open, intervals } };
    });
  };

  const addInterval = (day: Weekday) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        intervals: [...prev[day].intervals, { from: "12:00", to: "13:00" }],
      },
    }));
  };

  const removeInterval = (day: Weekday, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        intervals: prev[day].intervals.filter((_, i) => i !== index),
      },
    }));
  };

  const updateInterval = (
    day: Weekday,
    index: number,
    field: keyof TimeInterval,
    value: string,
  ) => {
    setSchedule((prev) => {
      const newIntervals = [...prev[day].intervals];
      newIntervals[index] = { ...newIntervals[index], [field]: value };
      return {
        ...prev,
        [day]: { ...prev[day], intervals: newIntervals },
      };
    });
  };

  return (
    <div className="border border-border bg-card rounded-xl p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" /> Horários de Funcionamento
          </h3>
          <p className="text-sm text-muted-foreground">
            Defina quando sua loja está aberta para receber pedidos e agendamentos.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? "Salvando..." : "Salvar Horários"}
        </Button>
      </div>

      <div className="space-y-6">
        {DAYS_ORDER.map((day) => {
          const config = schedule[day];
          return (
            <div
              key={day}
              className="flex flex-col sm:flex-row gap-4 items-start sm:items-center py-2"
            >
              <div className="w-40 flex items-center gap-3">
                <Switch checked={config.open} onCheckedChange={() => toggleDay(day)} />
                <Label
                  className={`font-medium ${!config.open && "text-muted-foreground line-through"}`}
                >
                  {DAYS_MAP[day]}
                </Label>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                {config.open ? (
                  <>
                    {config.intervals.map((interval, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          type="time"
                          className="w-32"
                          value={interval.from}
                          onChange={(e) => updateInterval(day, i, "from", e.target.value)}
                        />
                        <span className="text-muted-foreground">até</span>
                        <Input
                          type="time"
                          className="w-32"
                          value={interval.to}
                          onChange={(e) => updateInterval(day, i, "to", e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInterval(day, i)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addInterval(day)}
                        className="text-xs text-primary gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Adicionar intervalo
                      </Button>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Fechado</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
