import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração básica e estável
  reactStrictMode: true,
  
  // Configurações de desenvolvimento
  typescript: {
    ignoreBuildErrors: false, // Habilitar type checking
  },
  
  eslint: {
    ignoreDuringBuilds: false, // Habilitar ESLint
  },
};

export default nextConfig;
