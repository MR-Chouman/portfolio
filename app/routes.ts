import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("work", "routes/work.tsx"),
  route("work/:slug", "routes/work.$slug.tsx"),
  route("about", "routes/about.tsx"),
  route("style-tile", "routes/style-tile.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
