function readRequiredPublicEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Configúrala en Vercel y en tu archivo .env.local.`
    );
  }

  return value;
}

export function getSupabaseUrl() {
  return readRequiredPublicEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL"
  );
}

export function getSupabaseAnonKey() {
  return readRequiredPublicEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export function getSiteUrl() {
  return readRequiredPublicEnv(
    process.env.NEXT_PUBLIC_SITE_URL,
    "NEXT_PUBLIC_SITE_URL"
  ).replace(/\/+$/, "");
}
