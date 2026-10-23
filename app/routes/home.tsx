import type { Route } from "./+types/home";

// Placeholder until the content layer (T-020) and home page (T-021) land.
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Mohamad Rida Chouman · Frontend lead" },
    {
      name: "description",
      content:
        "Portfolio of Mohamad Rida Chouman, a frontend lead building enterprise admin platforms.",
    },
  ];
}

export default function Home() {
  return (
    <div className="page-container pt-section">
      <h1 className="max-w-reading text-4xl">Mohamad Rida Chouman</h1>
      <p className="mt-2 text-fg-muted">Portfolio in progress.</p>
    </div>
  );
}
