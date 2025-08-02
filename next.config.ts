import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilita o modo estrito do React
  reactStrictMode: true,
  typescript: {
    // Ignora erros de type checking durante o build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Evita que warnings do ESLint quebrem o build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
