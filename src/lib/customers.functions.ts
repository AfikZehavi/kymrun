import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CustomerDetails = {
  email: string;
  full_name: string;
  phone: string;
  address: string;
};

const emailSchema = z.object({
  email: z.string().trim().email().max(255),
});

const detailsSchema = z.object({
  email: z.string().trim().email().max(255),
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  address: z.string().trim().min(4).max(255),
});

export const lookupCustomer = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string }) => emailSchema.parse(d))
  .handler(
    async ({
      data,
    }): Promise<{ exists: boolean; customer: CustomerDetails | null }> => {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: row, error } = await supabaseAdmin
        .from("customers")
        .select("email, full_name, phone, address")
        .eq("email", data.email.toLowerCase())
        .maybeSingle();
      if (error) throw error;
      return {
        exists: Boolean(row),
        customer: (row as CustomerDetails | null) ?? null,
      };
    },
  );

export const saveCustomer = createServerFn({ method: "POST" })
  .inputValidator((d: CustomerDetails) => detailsSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin.from("customers").upsert(
      {
        email: data.email.toLowerCase(),
        full_name: data.full_name,
        phone: data.phone,
        address: data.address,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "email" },
    );
    if (error) throw error;
    return { ok: true };
  });
