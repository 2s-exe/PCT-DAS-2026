/** @type {import('next').NextConfig} */
const nextConfig = {
  // No rewrites - frontend will call backend directly at http://backend:8000 from container
  // or http://localhost:8000 from browser
}

module.exports = nextConfig
