/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...keep your current options...

  async rewrites() {
    return [
      { source: '/sandbox/api/:path*', destination: '/api/sandbox/:path*' },
    ];
  },
};

export default nextConfig;