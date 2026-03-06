/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: {
    appIsrStatus: false,
  },
  experimental: {
    allowedDevOrigins: ["192.168.56.1", "localhost"],
  },
};

export default nextConfig;
