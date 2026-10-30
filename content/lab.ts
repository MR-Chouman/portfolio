// Copy for the lab page (/lab), its server-style data table (T-051) and its
// create and edit drawer (T-052).
// Validated by labSchema at build time (content/load.ts). The records the
// table lists are invented demo data generated in app/lib/lab/records.ts
// (D-044). The page introduction is refined in T-054.
import type { Lab } from "./schema";

export const lab = {
  meta: {
    title: "Lab · Mohamad Rida Chouman",
    description:
      "Live demos of admin platform patterns: a server-style data table with filters, sorting, pagination and URL state, and a create and edit drawer, over invented data.",
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
  crud: {
    hint: "Create or edit an asset in a drawer. A save shows in the table at once and rolls back if the mock server fails it; changes last until you reload.",
    create: "New asset",
    edit: "Edit {name}",
    editShort: "Edit",
    actions: "Actions",
    newId: "New",
    saving: "Saving…",
    saved: "{name} saved.",
    failed: {
      title: "{name} was not saved",
      body: "The mock server returned an error, so the table went back to how it was. Open the drawer to try again.",
      dismiss: "Dismiss",
    },
    drawer: {
      createTitle: "New asset",
      editTitle: "Edit {id}",
      intro: "Every field is required. The value is in whole US dollars.",
      close: "Close",
      cancel: "Cancel",
      save: "Save asset",
      choose: "Choose…",
      fields: {
        name: "Name",
        category: "Category",
        status: "Status",
        site: "Site",
        value: "Value (USD)",
      },
      valueHint: "Digits only, for example 12500.",
      fail: {
        label: "Make this save fail",
        hint: "Shows the change at once, then rolls it back, as after a server error.",
      },
    },
    errors: {
      nameRequired: "Enter a name.",
      nameShort: "Use at least 2 characters.",
      nameLong: "Use 60 characters or fewer.",
      categoryRequired: "Choose a category.",
      statusRequired: "Choose a status.",
      siteRequired: "Choose a site.",
      valueRequired: "Enter a value.",
      valueWhole: "Enter a whole number of 0 or more, digits only.",
      valueMax: "Enter 1000000 or less.",
    },
  },
} satisfies Lab;
