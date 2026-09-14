import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type InquiryKind = "event" | "tasting" | "contact" | "gold";

const schema = z.object({
  kind: z.enum(["event", "tasting", "contact", "gold"]),
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(30),
  city: z.string().trim().max(100).default(""),
  event_date: z.string().trim().max(40).default(""),
  guests: z.number().int().min(0).max(5000).default(0),
  budget: z.string().trim().max(60).default(""),
  message: z.string().trim().max(2000).default(""),
});

export type InquiryInput = z.input<typeof schema>;

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((d: InquiryInput) => schema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin.from("inquiries").insert({
      ...data,
      email: data.email.toLowerCase(),
    } as never);
    if (error) throw error;
    return { ok: true };
  });
