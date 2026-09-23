// Public by design: the publishable key ships to every browser anyway, and
// row-level security in Supabase is what protects the data. Kept in code rather
// than Vercel env vars because the Vercel↔Supabase integration overrides
// NEXT_PUBLIC_SUPABASE_* with a different, empty project.
// Never put the service_role / secret key here.
export const SUPABASE_URL = "https://jembbyuqpucvbgixfkvs.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_YVpGmDBNOi-IUQdDxJegvw_1eVC40Dk";
