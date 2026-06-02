/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // nodemailer uses Node built-ins / dynamic requires — load it at runtime, don't bundle.
  experimental: {
    serverComponentsExternalPackages: ['nodemailer']
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'jvdmwvzlunmouvlvtebg.supabase.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' }
    ]
  }
};
export default nextConfig;
