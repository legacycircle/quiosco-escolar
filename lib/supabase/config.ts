function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Configúrala en Vercel y en tu archivo .env.local.`
    );
  }

  return value;
}

export function getSupabaseUrl() {
  return readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getSiteUrl() {
  return readRequiredEnv("NEXT_PUBLIC_SITE_URL").replace(/\/+$/, "");
}
