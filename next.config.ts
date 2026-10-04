import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Uploaded profile/group images are served from Cloudinary's CDN.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
