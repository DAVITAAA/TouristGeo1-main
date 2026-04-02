import { createClient } from "@supabase/supabase-js";

// Replace these with your actual Supabase URL and Anon/Public Key
// You can find these in your Supabase project settings -> API
const SUPABASE_URL = "https://eapyledvoovsajlkllwl.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_Q7qOa3wJ-JjUDKLJigsZCQ_PawopRmC";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
