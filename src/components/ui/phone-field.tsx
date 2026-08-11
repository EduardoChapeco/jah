import React, { useState, forwardRef } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { parsePhoneNumber, AsYouType } from "libphonenumber-js";

export interface PhoneFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string; // Esperado em E.164, ex: +5511999999999
  onChange?: (value: string | undefined) => void;
  defaultCountry?: "BR" | string;
}

export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(
  ({ className, value, onChange, defaultCountry = "BR", onBlur, ...props }, ref) => {
    // Formata o valor inicial E.164 para exibir na máscara (ex: +55 11 99999-9999)
    const getInitialDisplay = () => {
      if (!value) return "";
      try {
        const phone = parsePhoneNumber(value);
        return phone.formatNational();
      } catch {
        return value;
      }
    };

    const [displayValue, setDisplayValue] = useState(getInitialDisplay());

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const formatter = new AsYouType(defaultCountry as any);
      const formatted = formatter.input(raw);
      setDisplayValue(formatted);

      try {
        const phone = formatter.getNumber();
        if (phone && phone.isValid()) {
          onChange?.(phone.format("E.164"));
        } else {
          // Se não for válido, podemos passar undefined ou o formato limpo, 
          // mas o ideal é que o hook-form valide. Vamos passar undefined se inválido.
          onChange?.(undefined);
        }
      } catch {
        onChange?.(undefined);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Formata no blur para garantir a máscara perfeita se for válido
      try {
        const phone = parsePhoneNumber(displayValue, defaultCountry as any);
        if (phone && phone.isValid()) {
          setDisplayValue(phone.formatNational());
          onChange?.(phone.format("E.164"));
        }
      } catch {
        // Ignora formatação se inválido
      }
      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        className={cn(className)}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="(11) 90000-0000"
        {...props}
      />
    );
  }
);
PhoneField.displayName = "PhoneField";
