/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export — deploys to GitHub Pages / Vercel / any static host,
  // exactly like the original, with zero server requirement.
  output: "export",
  images: { unoptimized: true },
  // Emit /work/pulsetrade/index.html so links work on static hosts.
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
