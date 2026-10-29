import { NotFound, notFoundMeta } from "~/components/sections/NotFound";

// Catch-all route (T-025): every URL no other route matches. Prerendered at
// /404 and moved to build/client/404.html after the build, which Cloudflare
// Pages serves with a 404 status for unknown URLs (D-027). On client-side
// navigation (for example to a route that does not exist yet) the same page
// renders without a request.
export function meta() {
  return notFoundMeta();
}

export default function NotFoundRoute() {
  return <NotFound />;
}
