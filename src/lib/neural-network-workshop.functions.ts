import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  NEURAL_NETWORK_ATTEND_REASONS,
  NEURAL_NETWORK_WORKSHOP_YEARS,
} from "@/data/neural-network-workshop";

const attendReason = z.enum(NEURAL_NETWORK_ATTEND_REASONS);

const registrationInput = z.object({
  name: z.string().trim().min(1).max(100),
  srn: z.string().trim().min(1).max(40),
  department: z.string().trim().min(1).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  email: z.string().trim().email().max(160),
  year: z.enum(NEURAL_NETWORK_WORKSHOP_YEARS),
  attendReason: z.array(attendReason).min(1).max(2),
  expectation: z.string().trim().min(1).max(3000),
});

export type NeuralNetworkWorkshopRegistration = {
  id: string;
  name: string;
  srn: string;
  department: string;
  phone: string;
  email: string;
  year: string;
  attend_reason: string;
  expectation: string;
  created_at: string;
};

export const registerForNeuralNetworkWorkshop = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registrationInput.parse(input))
  .handler(async ({ data }) => {
    const { clientKey, rateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
    try {
      rateLimit(await clientKey("neural-network-workshop", "registration"), 5, 60 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(
          `Too many registration attempts. Try again in ${error.retryAfterSeconds}s.`,
        );
      }
      throw error;
    }

    // Registration is a server-side write. Use the service-role client so this
    // cannot fail because the request is running as the anonymous Supabase role
    // (and never expose that client to the browser bundle).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("neural_network_workshop_registrations").insert({
      name: data.name,
      srn: data.srn.toUpperCase(),
      department: data.department,
      phone: data.phone,
      email: data.email.toLowerCase(),
      year: data.year,
      attend_reason: data.attendReason.join(" | "),
      expectation: data.expectation,
    });

    if (error?.code === "23505") {
      throw new Error("You have already registered for this workshop with this SRN.");
    }
    if (error) {
      console.error("[Workshop registration] Supabase insert failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      if (error.code === "42P01" || error.code === "PGRST205") {
        throw new Error(
          "Workshop registration is not available yet. The database migration must be applied.",
        );
      }

      throw new Error("Could not save your registration. Please try again.");
    }

    return { ok: true };
  });

export const listNeuralNetworkWorkshopRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NeuralNetworkWorkshopRegistration[]> => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await context.supabase
      .from("neural_network_workshop_registrations")
      .select(
        "id, name, srn, department, phone, email, year, attend_reason, expectation, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load workshop registrations.");
    return data ?? [];
  });
