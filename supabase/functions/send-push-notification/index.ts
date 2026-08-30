import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

type PushType = "handover" | "inventory_flag" | "reservation" | "user_pending";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const CONNECTION_KEY = Deno.env.get("FIREBASE_MESSAGING_API_KEY");
    if (!LOVABLE_API_KEY || !CONNECTION_KEY) {
      throw new Error("Push connector is not configured");
    }

    const { type, title, body, path = "/", actorUsername, department } = (await req.json()) as {
      type: PushType;
      title: string;
      body: string;
      path?: string;
      actorUsername?: string;
      department?: string;
    };

    if (!type || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing type/title/body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let query = supabase.from("push_tokens").select("token, username, role, topics");
    if (type === "user_pending") {
      query = query.eq("role", "admin");
    } else if (type === "reservation") {
      query = query.in("department", [department ?? "polskie_smaki", "all"]);
    }
    const { data: rows, error } = await query;
    if (error) throw error;

    const tokens = (rows ?? [])
      .filter((r: any) => r.username !== actorUsername)
      // Respect each device's notification preferences (missing topics = all enabled).
      .filter((r: any) => !Array.isArray(r.topics) || r.topics.includes(type))
      .map((r: any) => r.token as string);

    let sent = 0;
    const stale: string[] = [];

    await Promise.all(
      tokens.map(async (token) => {
        const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": CONNECTION_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              data: { path },
              webpush: { notification: { icon: "/icon-192.png" } },
            },
          }),
        });
        if (res.ok) {
          sent++;
        } else {
          const err = await res.text();
          if (res.status === 404 || res.status === 400) stale.push(token);
          console.error(`FCM send failed [${res.status}]: ${err}`);
        }
      }),
    );

    if (stale.length) {
      await supabase.from("push_tokens").delete().in("token", stale);
    }

    return new Response(JSON.stringify({ sent, removed: stale.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-push-notification failed:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
