// Copy for the lab page (/lab) and its server-style data table (T-051).
// Validated by labSchema at build time (content/load.ts). The records the
// table lists are invented demo data generated in app/lib/lab/records.ts
// (D-044). The page introduction is refined in T-054.
import type { Lab } from "./schema";

export const lab = {
  meta: {
    title: "Lab · Mohamad Rida Chouman",
    description:
      "Live demos of admin platform patterns: a server-style data table with filters, sorting, pagination and URL state, over invented data.",
  },
  header: {
    eyebrow: "Lab",
    title: "Admin patterns, live",
    intro:
      "Working versions of the patterns behind the case studies, running on invented data in your browser. Nothing here talks to a real server.",
  },
  table: {
    eyebrow: "Pattern",
    title: "Server-style data table",
    intro:
      "Filtering, sorting and pagination happen behind a mock endpoint with a short delay, the way a real list API answers. The whole state lives in the URL, so reload, share or use back and forward.",
    caption: "Equipment assets (invented data)",
    regionLabel: "Asset table, scrolls sideways on small screens",
    columns: {
      id: "ID",
      name: "Name",
      category: "Category",
      status: "Status",
      site: "Site",
      value: "Value",
      updatedAt: "Updated",
    },
    filters: {
      label: "Filters",
      search: "Search",
      searchHint: "ID or name",
      status: "Status",
      category: "Category",
      site: "Site",
      clear: "Clear filters",
    },
    values: {
      status: {
        active: "Active",
        maintenance: "Maintenance",
        reserved: "Reserved",
        retired: "Retired",
      },
      category: {
        vehicle: "Vehicle",
        machinery: "Machinery",
        it: "IT",
        tooling: "Tooling",
        safety: "Safety",
      },
    },
    pagination: {
      label: "Table pages",
      pageSize: "Rows per page",
      previous: "Previous page",
      next: "Next page",
      first: "First page",
      last: "Last page",
      range: "{from}–{to} of {total}",
      page: "Page {page} of {pageCount}",
    },
    loading: "Loading assets…",
    empty: {
      title: "No matching assets",
      body: "No asset matches these filters. Change the search or clear the filters.",
    },
    error: {
      title: "The assets could not be loaded",
      body: "The mock server returned an error. Your filters are kept; try the request again.",
      retry: "Try again",
    },
    simulate: {
      label: "Simulate a server error",
      hint: "Reloads the table with one failed request, to show the error state.",
    },
  },
} satisfies Lab;
