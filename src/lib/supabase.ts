import { createClient, type Session } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function getSupabaseSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function supabaseFetch(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string>;
    headers?: Record<string, string>;
  } = {},
) {
  const { method = "GET", body, query = {}, headers = {} } = options;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.",
    );
  }

  const session = await getSupabaseSession();

  if (!session) {
    throw new Error("You must be signed in before accessing your habits.");
  }

  const url = new URL(`${supabaseUrl}${path}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, String(value));
    }
  });

  const requestHeaders = {
    "Content-Type": "application/json",
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${session.access_token}`,
    ...(method !== "GET" ? { Prefer: "return=representation" } : {}),
    ...headers,
  };

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  console.log("Supabase status:", response.status);
  console.log("Supabase response:", responseBody);

  if (!response.ok) {
    const message =
      typeof responseBody === "string"
        ? responseBody
        : responseBody?.message ||
          responseBody?.error ||
          "Supabase request failed.";

    throw new Error(message);
  }

  return responseBody;
}
