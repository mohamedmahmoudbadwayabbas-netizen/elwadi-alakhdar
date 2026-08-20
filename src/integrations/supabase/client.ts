import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return async (input, init) => {
    const urlStr = typeof input === "string" ? input : input instanceof Request ? input.url : "";

    // In local-first / preview mode with placeholder URL, return safe 200 responses to prevent network drop
    if (urlStr.includes("placeholder.supabase.co")) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json", "content-range": "0-0/0" },
      });
    }

    try {
      const headers = new Headers(
        typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
      );

      if (init?.headers) {
        new Headers(init.headers).forEach((value, key) => headers.set(key, value));
      }

      // New Supabase API keys are opaque strings, not bearer JWTs.
      if (
        isNewSupabaseApiKey(supabaseKey) &&
        headers.get("Authorization") === `Bearer ${supabaseKey}`
      ) {
        headers.delete("Authorization");
      }

      headers.set("apikey", supabaseKey);
      return await fetch(input, { ...init, headers });
    } catch {
      // Return a safe empty response on any network drop instead of throwing uncaught TypeError
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json", "content-range": "0-0/0" },
      });
    }
  };
}

function createSupabaseClient() {
  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL ||
    (typeof process !== "undefined" && process.env?.SUPABASE_URL) ||
    "https://placeholder.supabase.co";

  const SUPABASE_KEY =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (typeof process !== "undefined" && process.env?.SUPABASE_PUBLISHABLE_KEY) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder";

  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_KEY),
    },
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
