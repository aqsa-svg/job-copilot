/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer ships its own bundling; keep it external on the server
  // so its font/canvas internals don't break the Next build.
  transpilePackages: ["@react-pdf/renderer"],
};

export default nextConfig;
