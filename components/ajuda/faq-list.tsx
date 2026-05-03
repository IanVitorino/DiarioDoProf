"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export interface FAQItem {
  pergunta: string;
  resposta: React.ReactNode;
}

interface Props {
  items: FAQItem[];
}

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function FAQList({ items }: Props) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = stripDiacritics(query.trim());
    if (q === "") return items;
    return items.filter((it) => {
      const haystack = stripDiacritics(
        `${it.pergunta} ${typeof it.resposta === "string" ? it.resposta : ""}`,
      );
      return haystack.includes(q);
    });
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-default-900">
          Perguntas frequentes
        </h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-500 pointer-events-none" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pergunta..."
            className="pl-10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-default-500 text-center py-8">
          Nenhuma pergunta encontrada para &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {filtered.map((it, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="!bg-card !shadow-none !py-0 border border-default-200 rounded-lg px-4 data-[state=open]:border-primary/40 data-[state=open]:bg-default-50/40 transition-colors"
            >
              <AccordionTrigger className="text-left text-sm font-medium text-default-900 hover:no-underline py-4">
                {it.pergunta}
              </AccordionTrigger>
              <AccordionContent className="!text-default-700 text-sm pb-4 leading-relaxed">
                {it.resposta}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
