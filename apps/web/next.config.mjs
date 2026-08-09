/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The design and shared packages are published as TypeScript source so that mobile
  // and web consume identical definitions rather than a compiled artefact that can lag.
  transpilePackages: ["@xoholy/design", "@xoholy/shared"],
};

export default nextConfig;
