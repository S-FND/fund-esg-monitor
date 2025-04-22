
// Edge Function: Send Team Member Invite Email via Resend

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitePayload {
  name: string;
  email: string;
  adminName: string | null;
  fundNames: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, adminName, fundNames }: InvitePayload = await req.json();

    const fundText = fundNames.length
      ? `<ul style="margin-left:16px;">${fundNames.map((fname) => `<li>${fname}</li>`).join('')}</ul>`
      : "<i>No funds assigned yet.</i>";

    const html =
      `<h2>Hello ${name},</h2>` +
      `<p>${adminName || "An Investor Admin"} has invited you to join their team on Lovable.</p>` +
      `<p><b>Assigned Funds:</b>${fundText}</p>` +
      `<p>Please check your inbox in the platform for how to get started. (This is a demo – no actual signup flow)</p>` +
      `<p>— The Lovable Team</p>`;

    const result = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: [email],
      subject: "You're Invited: Join Your Investment Team on Lovable",
      html,
    });

    if ((result as any).error) {
      throw new Error((result as any).error);
    }

    return new Response(
      JSON.stringify({ sent: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e: any) {
    console.error("Error sending invite:", e);
    return new Response(
      JSON.stringify({ error: e.message || e.toString() }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
