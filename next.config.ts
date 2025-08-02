import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suprimir warnings de hidratação causados por extensões do navegador
  reactStrictMode: true,
  experimental: {
    // Suprimir warnings de hidratação para atributos adicionados por extensões
    suppressHydrationWarning: true,
  },
};

export default nextConfig;
