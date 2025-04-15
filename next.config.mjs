import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in dev mode
  // You can add more PWA options here if needed
});

// Merge PWA config with your Next.js config
const mergedConfig = {
  ...nextConfig,
  ...pwaConfig(), // Execute the function returned by withPWA
};

export default mergedConfig;
