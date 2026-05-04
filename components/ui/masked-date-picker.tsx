"use client";

import * as React from "react";
import Flatpickr from "react-flatpickr";
import { Portuguese } from "flatpickr/dist/l10n/pt.js";
import { Calendar } from "lucide-react";
import { isoToLocalDate, localToIsoString } from "@/lib/dates";

const inputClass =
  "w-full bg-background border border-default-300 rounded-md pl-3 pr-10 h-9 text-sm text-default-900 placeholder:text-accent-foreground/50 focus:outline-none focus:border-primary transition";

const ALLOWED_NAV_KEYS = [
  "Backspace",
  "Delete",
  "Tab",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "Enter",
];

function handleDateKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.ctrlKey || e.metaKey) return;
  if (ALLOWED_NAV_KEYS.includes(e.key)) return;
  const isDigit = /^[0-9]$/.test(e.key);
  if (!isDigit) {
    e.preventDefault();
    return;
  }
  const target = e.currentTarget;
  if (
    target.value.length >= 10 &&
    target.selectionStart === target.selectionEnd
  ) {
    e.preventDefault();
  }
}

function applyDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  if (digits.length > 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

function handleDateInput(e: React.FormEvent<HTMLInputElement>) {
  const target = e.currentTarget;
  const masked = applyDateMask(target.value);
  if (target.value !== masked) {
    target.value = masked;
  }
}

interface Props {
  value: string;
  onChange: (iso: string) => void;
  id?: string;
  placeholder?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
  /** Render inline (use dentro de modais para evitar overflow). */
  staticPosition?: boolean;
}

export function MaskedDatePicker({
  value,
  onChange,
  id,
  placeholder,
  minDate,
  maxDate,
  staticPosition,
}: Props) {
  const fpRef = React.useRef<any>(null);
  return (
    <div className="relative [&_.flatpickr-wrapper]:block [&_.flatpickr-wrapper]:w-full">
      <Flatpickr
        ref={fpRef}
        id={id}
        options={{
          dateFormat: "d/m/Y",
          locale: Portuguese,
          allowInput: true,
          clickOpens: false,
          static: staticPosition,
          // Sem isso, o Flatpickr troca pelo <input type="date"> nativo do
          // browser em mobile, fazendo o campo aparecer duplicado.
          disableMobile: true,
          defaultDate: isoToLocalDate(value),
          minDate,
          maxDate,
        }}
        onChange={(dates) => onChange(dates[0] ? localToIsoString(dates[0]) : "")}
        onKeyDown={handleDateKeyDown}
        onInput={handleDateInput}
        placeholder={placeholder ?? "dd/mm/aaaa"}
        className={inputClass}
        maxLength={10}
      />
      <button
        type="button"
        onClick={() => fpRef.current?.flatpickr?.open()}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-default-500 hover:text-primary p-1 rounded transition-colors"
        aria-label="Abrir calendário"
        tabIndex={-1}
      >
        <Calendar className="w-4 h-4" />
      </button>
    </div>
  );
}
