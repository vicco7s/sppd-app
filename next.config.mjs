/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: {
    appIsrStatus: false,
  },
  // Redirects configuration delete if you want to redirect /login
  async redirects() {
    return [{ source: "/login", destination: "/warning", permanent: false }];
  },
};

export default nextConfig;
