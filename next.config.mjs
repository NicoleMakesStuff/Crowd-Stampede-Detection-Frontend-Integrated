/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5001/api/:path*',
      },
      {
        source: '/video_feed',
        destination: 'http://127.0.0.1:5001/video_feed',
      },
      {
        source: '/latest_image',
        destination: 'http://127.0.0.1:5001/latest_image',
      },
    ]
  },
}

export default nextConfig
