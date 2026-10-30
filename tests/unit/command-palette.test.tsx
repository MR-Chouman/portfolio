import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CommandMenu,
  isPaletteShortcut,
} from "~/components/layout/CommandMenu";
import { downloadCv } from "~/components/layout/CommandPalette";
import { projects } from "~/lib/projects";

import { contact } from "../../content/contact";
import { site } from "../../content/site";

// The command palette (T-043): shortcut, lazy dialog, commands. The browser
// behaviour (focus, inert page, real downloads) is covered by
// tests/e2e/command-palette.spec.ts.

const copy = site.commandPalette;
const html = document.documentElement;

// jsdom has no modal dialogs: emulate `open` and the close event.
function stubDialog() {
  const proto = HTMLDialogElement.prototype;
  vi.spyOn(proto, "showModal").mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  vi.spyOn(proto, "close").mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  });
}

beforeEach(() => {
  if (!("showModal" in HTMLDialogElement.prototype)) {
    Object.assign(HTMLDialogElement.prototype, {
      showModal() {},
      close() {},
    });
  }
  stubDialog();
  // cmdk measures the list and scrolls the active item into view.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView = () => {};
  html.dataset.theme = "light";
  html.dataset.skin = "editorial";
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderMenu(path = "/") {
  const router = createMemoryRouter(
    [
      { path: "/", element: <CommandMenu /> },
      { path: "*", element: <CommandMenu /> },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const trigger = () => screen.getByRole("button", { name: copy.open });

async function openWithShortcut(init: KeyboardEventInit = { ctrlKey: true }) {
  fireEvent.keyDown(window, { key: "k", ...init });
  return screen.findByRole("combobox", { name: copy.inputLabel });
}

function option(name: string | RegExp) {
  return screen.getByRole("option", { name });
}

describe("isPaletteShortcut", () => {
  it("accepts Ctrl+K and Cmd+K only", () => {
    const key = (init: KeyboardEventInit) => new KeyboardEvent("keydown", init);
    expect(isPaletteShortcut(key({ key: "k", ctrlKey: true }))).toBe(true);
    expect(isPaletteShortcut(key({ key: "K", metaKey: true }))).toBe(true);
    expect(isPaletteShortcut(key({ key: "k" }))).toBe(false);
    expect(isPaletteShortcut(key({ key: "j", ctrlKey: true }))).toBe(false);
    expect(
      isPaletteShortcut(key({ key: "k", ctrlKey: true, shiftKey: true })),
    ).toBe(false);
    expect(
      isPaletteShortcut(key({ key: "k", metaKey: true, altKey: true })),
    ).toBe(false);
  });
});

describe("CommandMenu", () => {
  it("renders a labelled trigger and no palette until asked", () => {
    renderMenu();
    expect(trigger()).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger()).toHaveAttribute("aria-keyshortcuts", "Control+K Meta+K");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens with Ctrl+K and Cmd+K, and the shortcut closes it again", async () => {
    renderMenu();
    await openWithShortcut();
    const dialog = screen.getByRole("dialog", { name: copy.label });
    expect(dialog).toHaveAttribute("open");

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(dialog).not.toHaveAttribute("open");

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    await waitFor(() => expect(dialog).toHaveAttribute("open"));
  });

  it("opens from the trigger and returns focus to it on close", async () => {
    renderMenu();
    trigger().focus();
    fireEvent.click(trigger());
    const input = await screen.findByRole("combobox", {
      name: copy.inputLabel,
    });
    act(() => {
      screen.getByRole("dialog").dispatchEvent(new Event("close"));
    });
    expect(trigger()).toHaveFocus();
    expect(input).toBeInTheDocument();
  });

  it("lists pages, case studies, preferences and the CV", async () => {
    renderMenu();
    await openWithShortcut();
    const listbox = screen.getByRole("listbox", { name: copy.listLabel });
    for (const name of [copy.home, ...site.navigation.map((n) => n.label)]) {
      expect(within(listbox).getByRole("option", { name })).toBeVisible();
    }
    for (const project of projects) {
      expect(option(new RegExp(project.title))).toBeInTheDocument();
    }
    expect(option("Switch to Systems design")).toBeInTheDocument();
    expect(option(copy.theme.dark)).toBeInTheDocument();
    expect(option(new RegExp(contact.cv.label))).toBeInTheDocument();
  });

  it("filters the commands as you type and says when nothing matches", async () => {
    renderMenu();
    const input = await openWithShortcut();
    fireEvent.change(input, { target: { value: "dark" } });
    await waitFor(() =>
      expect(screen.getAllByRole("option")).toEqual([option(copy.theme.dark)]),
    );
    fireEvent.change(input, { target: { value: "zzzzqq" } });
    expect(await screen.findByText(copy.empty)).toBeInTheDocument();
  });

  it("navigates to a page and closes", async () => {
    const router = renderMenu();
    await openWithShortcut();
    fireEvent.click(option("About"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/about"));
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute(
      "open",
    );
  });

  it("navigates to a case study", async () => {
    const router = renderMenu();
    const input = await openWithShortcut();
    const first = projects[0];
    if (!first) throw new Error("No projects");
    fireEvent.change(input, { target: { value: first.title } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/work/${first.slug}`),
    );
  });

  it("switches the theme and announces it", async () => {
    renderMenu();
    await openWithShortcut();
    fireEvent.click(option(copy.theme.dark));
    expect(html.dataset.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(screen.getByRole("status")).toHaveTextContent(copy.themeOn.dark);
  });

  it("switches the design and announces it", async () => {
    renderMenu();
    await openWithShortcut();
    fireEvent.click(option("Switch to Systems design"));
    await waitFor(() => expect(html.dataset.skin).toBe("systems"));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Systems design on"),
    );
  });

  it("downloads the CV", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.getAttribute("href")).toBe(contact.cv.href);
        expect(this.download).toBe(contact.cv.fileName);
      });
    renderMenu();
    await openWithShortcut();
    fireEvent.click(option(new RegExp(contact.cv.label)));
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector("a[download]")).toBeNull();
  });
});

describe("downloadCv", () => {
  it("clicks a temporary download link", () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    downloadCv();
    expect(click).toHaveBeenCalledTimes(1);
  });
});
