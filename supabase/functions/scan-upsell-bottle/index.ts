import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior bar manager and spirits expert helping Sheraton Bar 512 staff upsell premium bottles.

You will be shown a photograph of a bottle of alcohol. Identify it as precisely as possible from the label (brand, expression, age statement if visible). Then generate content the staff can use when recommending it to guests.

Return via the extract_bottle tool with:
- name: full product name (e.g. "Macallan 12 Double Cask", "Grey Goose Vodka"). If truly unreadable, use best-guess with "(unverified)" suffix.
- category: one of "Whisky", "Vodka", "Gin", "Rum", "Tequila", "Cognac", "Liqueur", "Wine", "Champagne", "Beer", "Other".
- price_tier: one of "House", "Premium", "Super-Premium", "Luxury".
- tasting_notes: 1-2 short sentences describing aroma, palate, finish in guest-friendly language.
- upsell_pitch: a 2-3 sentence conversational pitch the bartender or server can say to a guest at the table. Warm, confident, not pushy. Highlight what makes it special (heritage, production, flavour) and suggest how to enjoy it (neat, on the rocks, in a specific cocktail).
- pairing_suggestions: short list (comma-separated) of foods or cocktails it pairs beautifully with.

Be accurate. If the label is ambiguous, pick the most likely product but keep the pitch generic enough to stay true.`;

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
              { type: "text", text: "Identify this bottle and write an upselling pitch for it." },
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
                    enum: ["Whisky", "Vodka", "Gin", "Rum", "Tequila", "Cognac", "Liqueur", "Wine", "Champagne", "Beer", "Other"],
                  },
                  price_tier: { type: "string", enum: ["House", "Premium", "Super-Premium", "Luxury"] },
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
      return new Response(JSON.stringify({ error: "Could not identify bottle from image" }), {
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