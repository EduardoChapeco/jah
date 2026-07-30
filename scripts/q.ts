import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function r() {
  const c1 = await supabase.from('categories').select('slug');
  console.log('Categories:', c1.data);
  const c2 = await supabase.from('collections').select('slug');
  console.log('Collections:', c2.data);
}
r();
