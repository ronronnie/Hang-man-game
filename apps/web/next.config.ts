import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hangman/game-core", "@hangman/shared"],
};

export default nextConfig;
