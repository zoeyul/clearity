/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@clearity/ui", "@clearity/lib"],
  output: "export", // Tauri/Capacitor용 정적 빌드 (서버 필요 시 제거)
};

module.exports = nextConfig;
