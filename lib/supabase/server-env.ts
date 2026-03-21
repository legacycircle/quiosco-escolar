import "server-only";

function readRequiredServerEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Configúrala en Vercel y en tu archivo .env.local.`
    );
  }

  return value;
}

export function getSupabaseServiceRoleKey() {
  return readRequiredServerEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY"
  );
}
