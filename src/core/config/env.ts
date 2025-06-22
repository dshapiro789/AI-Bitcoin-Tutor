// Environment configuration with proper typing
interface Environment {
  supabase: {
    url: string;
    anonKey: string;
  };
  openRouter: {
    apiKey: string;
  };
}

const validateEnvVar = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env: Environment = {
  supabase: {
    url: validateEnvVar(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL'),
    anonKey: validateEnvVar(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY'),
  },
  openRouter: {
    apiKey: validateEnvVar(import.meta.env.VITE_OPENROUTER_DEEPSEEK_KEY, 'VITE_OPENROUTER_DEEPSEEK_KEY'),
  },
};

// Export individual configs for convenience
export const supabaseConfig = env.supabase;
export const openRouterConfig = env.openRouter;