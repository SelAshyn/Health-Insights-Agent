import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate at module load time so the error is immediate and obvious,
// rather than a cryptic "Cannot read properties of undefined" deep in a fetch call.
if (!url || url === "your-project-url") {
  throw new Error(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL is not set. " +
    "Add it to front-end/.env.local and restart the dev server."
  );
}

if (!key || key === "your-anon-key") {
  throw new Error(
    "[supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. " +
    "Add it to front-end/.env.local and restart the dev server."
  );
}

export const supabase = createClient(url, key);
