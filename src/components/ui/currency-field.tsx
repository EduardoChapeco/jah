import React, { useState, useEffect, forwardRef } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface CurrencyFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: number; // Valor em centavos
  onChange?: (value: number | undefined) => void;
  currencySymbol?: string;
}

/**
 * CurrencyField
 * Componente canônico para moedas.
 * Armazena o valor externamente como inteiro (centavos).
 * Internamente lida com a digitação livre e aplica máscara no blur.
 */
export const CurrencyField = forwardRef<HTMLInputElement, CurrencyFieldProps>(
  ({ className, value, onChange, currencySymbol = "R$", onBlur, onFocus, ...props }, ref) => {
    // Estado interno string para permitir digitação livre (ex: "123,45")
    const [displayValue, setDisplayValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // Sincroniza o valor externo (centavos) para o display
    useEffect(() => {
      if (!isFocused) {
        if (value === undefined || value === null) {
          setDisplayValue("");
        } else {
          // Converte centavos para decimal formatado (ex: 123456 -> "1.234,56")
          const decimalValue = value / 100;
          setDisplayValue(
            new Intl.NumberFormat("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(decimalValue)
          );
        }
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove tudo que não for dígito ou vírgula
      let raw = e.target.value.replace(/[^\d,]/g, "");
      
      // Garante que só exista uma vírgula
      const parts = raw.split(",");
      if (parts.length > 2) {
        raw = parts[0] + "," + parts.slice(1).join("");
      }
      // Limita a 2 casas decimais
      if (parts[1]?.length > 2) {
        raw = parts[0] + "," + parts[1].slice(0, 2);
      }

      setDisplayValue(raw);

      if (!raw) {
        onChange?.(undefined);
        return;
      }

      // Converte a string digitada de volta para centavos
      const normalized = raw.replace(",", ".");
      const floatVal = parseFloat(normalized);
      if (!isNaN(floatVal)) {
        const cents = Math.round(floatVal * 100);
        onChange?.(cents);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {currencySymbol}
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          className={cn("pl-9", className)}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...props}
        />
      </div>
    );
  }
);
CurrencyField.displayName = "CurrencyField";
