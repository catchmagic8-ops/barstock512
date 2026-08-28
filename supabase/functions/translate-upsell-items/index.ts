import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: items, error } = await supabase
      .from("upsell_items_bar512")
      .select("id, name, tasting_notes, upsell_pitch, pairing_suggestions");
    if (error) throw error;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Jesteś ekspertem od alkoholi i tłumaczem. Otrzymasz listę pozycji z baru z treściami po angielsku (nuty smakowe, pitch sprzedażowy, propozycje łączenia).
Przetłumacz KAŻDĄ pozycję na naturalny, profesjonalny język POLSKI — tak, żeby barman mógł użyć tego tekstu wprost w rozmowie z gościem. Zachowaj sens i ton (ciepły, pewny, bez nachalności). Nazwy marek/produktów (name) pozostaw bez zmian.
Zwróć wynik przez narzędzie save_translations: tablicę "items" z obiektami {id, tasting_notes, upsell_pitch, pairing_suggestions} po polsku. Jeśli pairing_suggestions było puste/null, zwróć null.`,
          },
          { role: "user", content: JSON.stringify(items ?? []) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_translations",
              description: "Return Polish translations for all items.",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        tasting_notes: { type: "string" },
                        upsell_pitch: { type: "string" },
                        pairing_suggestions: { type: ["string", "null"] },
                      },
                      required: ["id", "tasting_notes", "upsell_pitch"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_translations" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Błąd usługi AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Brak odpowiedzi AI");
    const { items: translated } = JSON.parse(toolCall.function.arguments);

    let updated = 0;
    for (const it of translated ?? []) {
      const { error: upErr } = await supabase
        .from("upsell_items_bar512")
        .update({
          tasting_notes: it.tasting_notes,
          upsell_pitch: it.upsell_pitch,
          pairing_suggestions: it.pairing_suggestions ?? null,
        })
        .eq("id", it.id);
      if (!upErr) updated++;
    }

    return new Response(JSON.stringify({ updated, total: items?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-upsell-items error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
