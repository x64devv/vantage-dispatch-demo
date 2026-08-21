/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠ Static export: no server, no route handlers, no next/image optimisation.
  //   The demo must run on a laptop with the network unplugged. This app has no
  //   map and therefore no tile dependency — unlike the driver app and console,
  //   it needs nothing from the room's wifi at all.
  output: 'export',
  // ⚠ /scan/[load], /consignment/[id] and /collection/[ref] are dynamic segments.
  //   They only export because each page.tsx declares generateStaticParams.
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
