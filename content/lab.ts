// Copy for the lab page (/lab), its server-style data table (T-051), its
// create and edit drawer (T-052) and its component gallery (T-053).
// Validated by labSchema at build time (content/load.ts). The records the
// table lists are invented demo data generated in app/lib/lab/records.ts
// (D-044). T-054 adds how each pattern works and links to its source in
// the site's public repository (files on main, the production branch).
import type { Lab } from "./schema";

export const lab = {
  meta: {
    title: "Lab · Mohamad Rida Chouman",
    description:
      "Live admin platform patterns over invented data: a server-style data table with URL state, a create and edit drawer with optimistic saves, and a component gallery.",
  },
  header: {
    eyebrow: "Lab",
    title: "Admin patterns, live",
    intro:
      "Three patterns that large admin platforms are built on, working in your browser: a server-style data table, a create and edit drawer, and the component gallery both are made from. Each one says how it works and links to its code. The data is invented and nothing here talks to a real server.",
    source: {
      label: "Browse the lab's source on GitHub",
      href: "https://github.com/MR-Chouman/portfolio/tree/main/app/components/lab",
    },
  },
  table: {
    eyebrow: "Pattern",
    title: "Server-style data table",
    intro:
      "Filtering, sorting and pagination happen behind a mock endpoint with a short delay, the way a real list API answers. The whole state lives in the URL, so reload, share or use back and forward.",
    notes: {
      title: "How the table works",
      points: [
        "The URL is the only state. Every control writes the whole query (search, filters, sort, page and rows per page) to the address, so a reload, a shared link or back and forward bring back the same view.",
        "A React Router client loader reads the URL and asks the mock endpoint for one page. A new request aborts the one it replaces, so a slow answer never overwrites a newer one.",
        "While a request runs, the controls already show the new state and the old rows stay, dimmed and marked busy. The empty and error states are part of the table, and Try again keeps your filters.",
        "The mock endpoint filters, sorts and pages 240 seeded records after a short delay, the way a list API answers.",
      ],
      sourceTitle: "Source on GitHub",
      source: [
        {
          label: "AssetTable.tsx",
          href: "https://github.com/MR-Chouman/portfolio/blob/main/app/components/lab/AssetTable.tsx",
        },
        {
          label: "routes/lab.tsx",
          href: "https://github.com/MR-Chouman/portfolio/blob/main/app/routes/lab.tsx",
        },
        {
          label: "lib/lab/client.ts",
          href: "https://github.com/MR-Chouman/portfolio/blob/main/app/lib/lab/client.ts",
        },
        {
          label: "lib/lab/query.ts",
          href: "https://github.com/MR-Chouman/portfolio/blob/main/app/lib/lab/query.ts",
        },
      ],
    },
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
    notes: {
      title: "How the drawer works",
      points: [
        "The drawer is a native modal dialog: the page behind it is inert, Escape closes it and focus goes back to the button that opened it.",
        "A Zod schema checks the form on submit and moves focus to the first error, then checks again as you type. Each error is tied to its field.",
        "Saves are optimistic: the row changes in the table at once, marked as saving, and rolls back with an alert if the mock server fails the save.",
      ],
      sourceTitle: "Source on GitHub",
      source: [
        {
          label: "AssetDrawer.tsx",
          href: "https://github.com/MR-Chouman/portfolio/blob/main/app/components/lab/AssetDrawer.tsx",
        },
        {
          label: "lib/lab/asset-form.ts",
          href: "https://github.com/MR-Chouman/portfolio/blob/main/app/lib/lab/asset-form.ts",
        },
        {
          label: "lib/lab/optimistic.ts",
          href: "https://github.com/MR-Chouman/portfolio/blob/main/app/lib/lab/optimistic.ts",
        },
        {
          label: "lib/lab/api.ts",
          href: "https://github.com/MR-Chouman/portfolio/blob/main/app/lib/lab/api.ts",
        },
      ],
    },
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
  gallery: {
    eyebrow: "Pattern",
    title: "Component gallery",
    intro:
      "The table and the drawer above are built from these primitives. Components use semantic color tokens only, so one set of markup serves both themes and all six accents: each panel below sets its own theme, and the accent rows set each accent in place. Hover, focus and use them to see the live states.",
    notes: {
      title: "How the gallery works",
      points: [
        "Components are styled with semantic tokens only (surface, text, line and accent), never raw colors, so one set of markup serves both themes and every accent.",
        "A theme or an accent is a data attribute that redefines the tokens below it: the panels set data-theme and the accent rows set data-accent.",
        "The table and the drawer use these same primitives, so a change to a primitive reaches every screen built from it.",
      ],
      sourceTitle: "Source on GitHub",
      source: [
        {
          label: "components/ui",
          href: "https://github.com/MR-Chouman/portfolio/tree/main/app/components/ui",
        },
        {
          label: "ComponentGallery.tsx",
          href: "https://github.com/MR-Chouman/portfolio/blob/main/app/components/lab/ComponentGallery.tsx",
        },
        {
          label: "styles/tokens.css",
          href: "https://github.com/MR-Chouman/portfolio/blob/main/app/styles/tokens.css",
        },
      ],
    },
    themes: {
      light: "Light theme",
      dark: "Dark theme",
    },
    blocks: {
      buttons: { title: "Buttons", components: "Button · ButtonLink" },
      links: { title: "Links", components: "Link" },
      tags: { title: "Tags", components: "Tag · TagList" },
      fields: { title: "Form fields", components: "Field · controlStyles" },
      chips: { title: "Filter chips", components: "CheckChip" },
      status: { title: "Status labels", components: "StatusLabel" },
      metrics: { title: "Metrics", components: "MetricList · Metric" },
      accents: { title: "Every accent", components: "data-accent" },
    },
    variants: {
      primary: "primary",
      secondary: "secondary",
      ghost: "ghost",
      small: "small",
      disabled: "disabled",
      link: "link as button",
      accent: "accent",
      muted: "muted",
      neutral: "neutral",
      list: "list",
      default: "default",
      hint: "with hint",
      select: "select",
      invalid: "invalid",
      unchecked: "unchecked",
      checked: "checked",
    },
    samples: {
      buttons: {
        primary: "Publish",
        secondary: "Discard",
        ghost: "Reset view",
        small: "Details",
        link: "Browse case studies",
      },
      links: {
        accent: "Read a case study",
        muted: "My background",
      },
      tags: {
        neutral: "Mock data",
        accent: "Live",
        list: ["React Router", "Zod", "Tailwind CSS"],
      },
      fields: {
        text: { label: "Title", value: "Forklift 12" },
        hint: {
          label: "Budget (USD)",
          value: "12500",
          hint: "Digits only, for example 12500.",
        },
        select: { label: "Type" },
        invalid: {
          label: "Quantity",
          value: "12.5",
          error: "Enter a whole number.",
        },
        disabled: { label: "Reference", value: "AST-0001" },
      },
      chips: {
        unchecked: "Draft",
        checked: "Approved",
        disabled: "Archived",
      },
      metrics: [
        { value: "240", label: "Invented assets" },
        { value: "4", label: "Statuses" },
        { value: "3", label: "Page sizes" },
      ],
      accentRow: "{accent} accent",
      accentSamples: {
        button: "Primary",
        link: "Link",
        tag: "Tag",
        chip: "Checked",
      },
    },
  },
} satisfies Lab;
