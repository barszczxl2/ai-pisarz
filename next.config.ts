import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  // CSP disabled for development - Supabase Realtime requires flexible WebSocket policy
  // Enable in production with proper configuration
  // {
  //   key: 'Content-Security-Policy',
  //   value: [
  //     "default-src 'self'",
  //     "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  //     "style-src 'self' 'unsafe-inline'",
  //     "img-src 'self' data: blob: https:",
  //     "font-src 'self' data:",
  //     "connect-src 'self' https: wss: ws:",
  //     "frame-ancestors 'none'",
  //     "base-uri 'self'",
  //     "form-action 'self'",
  //   ].join('; ')
  // }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Aplikuj security headers do wszystkich routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
