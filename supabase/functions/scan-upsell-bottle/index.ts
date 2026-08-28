import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Jesteś doświadczonym managerem baru i ekspertem od alkoholi, który pomaga zespołowi Sheraton Bar 512 sprzedawać premium butelki.

Otrzymasz zdjęcie butelki alkoholu. Zidentyfikuj ją jak najdokładniej z etykiety (marka, wersja, wiek jeśli widoczny). Następnie wygeneruj treści, których obsługa użyje w rozmowie z gościem.

WAŻNE: WSZYSTKIE treści (nuty smakowe, pitch, propozycje łączenia) piszesz WYŁĄCZNIE w języku POLSKIM, naturalnym i profesjonalnym.

Zwróć dane przez narzędzie extract_bottle:
- name: pełna nazwa produktu (np. "Macallan 12 Double Cask"). Jeśli etykieta nieczytelna, podaj najbardziej prawdopodobną nazwę z dopiskiem "(niepotwierdzone)".
- category: jedna z: "Whisky", "Wódka", "Gin", "Rum", "Tequila", "Koniak", "Likier", "Wino", "Szampan", "Piwo", "Inne".
- price_tier: jedna z: "Standard", "Premium", "Super-Premium", "Luksus".
- tasting_notes: 1-2 krótkie zdania po polsku o aromacie, smaku i finiszu, językiem zrozumiałym dla gościa.
- upsell_pitch: 2-3 zdania po polsku, które barman lub kelner może powiedzieć gościowi przy stoliku. Ciepło, pewnie, bez nachalności. Podkreśl co wyróżnia ten alkohol i zaproponuj sposób podania (czysto, z lodem, w konkretnym koktajlu).
- pairing_suggestions: krótka lista po polsku (oddzielona przecinkami) potraw lub koktajli, z którymi świetnie się łączy.

Bądź dokładny. Jeśli etykieta jest niejednoznaczna, wybierz najbardziej prawdopodobny produkt, ale utrzymaj pitch na tyle ogólny, by pozostał prawdziwy.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Zidentyfikuj tę butelkę i napisz po polsku pitch sprzedażowy." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_bottle",
              description: "Return the identified bottle and upsell content in structured form.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: {
                    type: "string",
                    enum: ["Whisky", "Wódka", "Gin", "Rum", "Tequila", "Koniak", "Likier", "Wino", "Szampan", "Piwo", "Inne"],
                  },
                  price_tier: { type: "string", enum: ["Standard", "Premium", "Super-Premium", "Luksus"] },
                  tasting_notes: { type: "string" },
                  upsell_pitch: { type: "string" },
                  pairing_suggestions: { type: "string" },
                },
                required: ["name", "category", "tasting_notes", "upsell_pitch"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_bottle" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Przekroczono limit zapytań, spróbuj ponownie później." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Wyczerpano kredyty AI. Dodaj kredyty w swoim workspace Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Błąd usługi AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Nie udało się rozpoznać butelki na zdjęciu" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ bottle: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-upsell-bottle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});