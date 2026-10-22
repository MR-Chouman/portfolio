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
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold">Mohamad Rida Chouman</h1>
      <p className="mt-2">Portfolio in progress.</p>
    </main>
  );
}
