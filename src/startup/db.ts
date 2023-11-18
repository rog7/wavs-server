import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY} from "../globalVars";

// Create a single supabase client for interacting with your database
console.log("url: " + SUPABASE_URL)
console.log("key: " + SUPABASE_KEY)
export const supabase = createClient(SUPABASE_URL as string, SUPABASE_KEY as string);
