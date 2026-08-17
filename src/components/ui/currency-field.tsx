import React, { useState, useEffect, forwardRef } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { formatCentsToBRL, parseBRLToCents } from "@/lib/money";

export interface CurrencyFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> {
  value?: number | null; // Valor em centavos inteiros (ex: 80000 = R$ 800,00)
  onChange?: (value: number | undefined) => void;
  currencySymbol?: string;
}

/**
 * CurrencyField
 * Componente canônico para entrada monetária em BRL.
 * Aplica máscara progressiva em tempo real enquanto o usuário digita.
 * Armazena e emite o valor externamente sempre como inteiro (centavos).
 */
export const CurrencyField = forwardRef<HTMLInputElement, CurrencyFieldProps>(
  ({ className, value, onChange, currencySymbol = "R$", onBlur, onFocus, placeholder = "0,00", ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("");

    // Sincroniza o valor externo (centavos) para a máscara visual
    useEffect(() => {
      if (value === undefined || value === null || isNaN(value)) {
        setDisplayValue("");
      } else {
        setDisplayValue(formatCentsToBRL(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawDigits = e.target.value.replace(/\D/g, "");

      if (!rawDigits || rawDigits === "0" || rawDigits === "00") {
        setDisplayValue("");
        onChange?.(undefined);
        return;
      }

      const cents = parseInt(rawDigits, 10);
      if (isNaN(cents)) {
        setDisplayValue("");
        onChange?.(undefined);
        return;
      }

      const formatted = formatCentsToBRL(cents);
      setDisplayValue(formatted);
      onChange?.(cents);
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none select-none">
          {currencySymbol}
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          className={cn("pl-9 font-mono font-semibold", className)}
          value={displayValue}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          {...props}
        />
      </div>
    );
  },
);
CurrencyField.displayName = "CurrencyField";
