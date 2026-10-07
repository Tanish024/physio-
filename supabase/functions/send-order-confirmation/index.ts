// Supabase Edge Function: send-order-confirmation
// Runtime: Deno (Supabase Functions)
// Sends an order confirmation email using Resend HTTP API.
// Set the secret in your project: RESEND_API_KEY

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price: number; // per item
}

interface Payload {
  email: string;
  name?: string;
  orderId?: string;
  items?: OrderItem[];
  total?: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function renderHtml(payload: Payload) {
  const itemsHtml = (payload.items || [])
    .map(
      (it) =>
        `<tr><td style=\"padding:6px 0\">${it.name} x ${it.quantity}</td><td style=\"padding:6px 0; text-align:right\">$${(it.price * it.quantity).toFixed(
          2,
        )}</td></tr>`,
    )
    .join("");

  return `
  <div style="font-family: Inter, Arial, sans-serif;">
    <h2>Thanks for your purchase${payload.name ? ", " + payload.name : ""}!</h2>
    ${payload.orderId ? `<p>Order ID: <strong>${payload.orderId}</strong></p>` : ""}
    <table style="width:100%; border-collapse:collapse;">${itemsHtml}</table>
    ${typeof payload.total === "number" ? `<p style="margin-top:8px;">Total: <strong>$${payload.total.toFixed(2)}</strong></p>` : ""}
    <p>We'll notify you when your order ships. If you have questions, just reply to this email.</p>
  </div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload: Payload = await req.json().catch(() => ({} as Payload));
    if (!payload.email) {
      return new Response(JSON.stringify({ error: "Missing email in body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const html = renderHtml(payload);

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FitSupps Store <orders@fitapps.dev>",
        to: [payload.email],
        subject: `Order Confirmation${payload.orderId ? ` #${payload.orderId}` : ""}`,
        html,
      }),
    });

    const data = await resendResp.json();
    if (!resendResp.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: "Failed to send email", details: data }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
