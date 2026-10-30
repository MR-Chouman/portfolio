import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "~/components/layout/SiteFooter";
import { SiteHeader } from "~/components/layout/SiteHeader";
import { SkipLink } from "~/components/layout/SkipLink";
import { formatDate } from "~/lib/date";

import { contact } from "../../content/contact";
import { site } from "../../content/site";

describe("SkipLink", () => {
  it("targets the main landmark", () => {
    render(<SkipLink />);
    expect(screen.getByRole("link", { name: site.skipLink })).toHaveAttribute(
      "href",
      "#main",
    );
  });
});

describe("SiteHeader", () => {
  it("links the name to home and lists the navigation", () => {
    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: /Mohamad Rida Chouman/ }),
    ).toHaveAttribute("href", "/");
    const nav = screen.getByRole("navigation", { name: site.navigationLabel });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      site.navigation.map((item) => item.href),
    );
  });

  it("offers the CV preview outside the navigation", () => {
    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );
    const cv = screen.getByRole("link", { name: "View CV (PDF)" });
    expect(cv).toHaveTextContent(contact.cv.shortLabel);
    expect(cv).toHaveAttribute("href", contact.cv.href);
    expect(cv).toHaveAttribute("download", contact.cv.fileName);
    const nav = screen.getByRole("navigation", { name: site.navigationLabel });
    expect(nav).not.toContainElement(cv);
  });

  it("marks the current section", () => {
    render(
      <MemoryRouter initialEntries={["/work"]}>
        <SiteHeader />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "About" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

describe("SiteFooter", () => {
  it("shows the last updated date as a machine-readable time", () => {
    render(<SiteFooter lastUpdated="2026-10-23T21:30:00Z" />);
    const time = screen.getByText("23 October 2026");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", "2026-10-23T21:30:00Z");
  });

  it("defaults to the build's last commit date", () => {
    render(<SiteFooter />);
    expect(screen.getByText("23 October 2026")).toBeInTheDocument();
  });
});

describe("formatDate", () => {
  it("keeps the calendar day written in the string, whatever the offset", () => {
    expect(formatDate("2026-10-23T02:21:31+03:00")).toBe("23 October 2026");
    expect(formatDate("2026-10-23T23:30:00-05:00")).toBe("23 October 2026");
  });
});

describe("SiteHeader floating bar", () => {
  it("publishes the bar height for scroll-padding-top and clears it on unmount", () => {
    const { unmount } = render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );
    const root = document.documentElement;
    // jsdom has no layout, so the measured height is 0 px.
    expect(root.style.getPropertyValue("--header-height")).toBe("0px");
    expect(screen.getByRole("banner")).toHaveClass("site-header");
    unmount();
    expect(root.style.getPropertyValue("--header-height")).toBe("");
  });
});
