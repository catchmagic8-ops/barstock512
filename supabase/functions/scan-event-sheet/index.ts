import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVENT_CATEGORIES = ["Wave", "Conference", "Bar512"];

const SYSTEM_PROMPT = `You are an assistant that extracts structured event information from a photograph or scan of a physical event sheet (poster, flyer, handwritten note, printed schedule).

Look carefully at the image and extract:
- title: short event name
- description: any extra details (theme, organiser, notes). Optional.
- event_date: the date in strict ISO format YYYY-MM-DD. If only a day/month is visible, assume the nearest upcoming occurrence from today's date. If no date at all, leave null.
- event_time: 24h time HH:MM. Optional.
- category: pick the SINGLE best fit from this exact list: ${EVENT_CATEGORIES.join(", ")}. Use "Conference" for conferences/meetings/corporate events, "Wave" for restaurant/Polskie Smaki dining events, "Bar512" for bar/lounge/cocktail events.
- food_menu: the food items / menu listed on the sheet, as plain text (one item per line if multiple). Optional.
- beverage_menu: the drinks / beverage items listed on the sheet, as plain text (one item per line if multiple). Optional.
- guest_count: number of people / pax / guests expected (whole integer). Optional.
- is_recurring: true if the sheet says weekly/every Friday/monthly etc.
- recurrence_rule: one of "weekly", "biweekly", "monthly" if is_recurring. Otherwise null.

Be conservative — if a field is unclear, return null rather than guess. Always return through the extract_event tool.`;

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

    const today = new Date().toISOString().slice(0, 10);

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
              { type: "text", text: `Today is ${today}. Extract the event details from this sheet.` },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_event",
              description: "Return the extracted event in structured form.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: ["string", "null"] },
                  event_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
                  event_time: { type: ["string", "null"], description: "HH:MM 24h" },
                  category: { type: "string", enum: EVENT_CATEGORIES },
                  food_menu: { type: ["string", "null"] },
                  beverage_menu: { type: ["string", "null"] },
                  guest_count: { type: ["integer", "null"] },
                  is_recurring: { type: "boolean" },
                  recurrence_rule: { type: ["string", "null"], enum: ["weekly", "biweekly", "monthly", null] },
                },
                required: ["title", "category", "is_recurring"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_event" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your Lovable workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Could not extract event from image" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ event: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-event-sheet error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
