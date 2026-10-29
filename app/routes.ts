import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("work/:slug", "routes/work.$slug.tsx"),
  route("style-tile", "routes/style-tile.tsx"),
] satisfies RouteConfig;
