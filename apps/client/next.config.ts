import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Inlined at build time (Render provides RENDER_GIT_COMMIT during builds).
  env: {
    NEXT_PUBLIC_BUILD_COMMIT:
      process.env.RENDER_GIT_COMMIT ?? process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "",
  },
};

export default nextConfig;
