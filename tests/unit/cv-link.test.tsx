import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from "vitest";

import {
  canPreviewPdf,
  CvLink,
  NO_INLINE_PDF_QUERY,
} from "~/components/layout/CvLink";

import { contact } from "../../content/contact";
import { contactSchema } from "../../content/schema";

// The CV preview (T-056). Real focus handling, the inert page, the frame and
// downloads are covered by tests/e2e/cv.spec.ts.

const copy = contact.cv.preview;

// jsdom has no modal dialogs: emulate `open` and the close event.
function stubDialog() {
  const proto = HTMLDialogElement.prototype;
  if (!("showModal" in proto)) {
    Object.assign(proto, { showModal() {}, close() {} });
  }
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

// Which media queries match and whether the browser reports a PDF viewer.
function stubBrowser({
  phone = false,
  pdfViewer = true,
}: { phone?: boolean; pdfViewer?: boolean } = {}) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: phone && query === NO_INLINE_PDF_QUERY,
    media: query,
  }));
  vi.spyOn(window.navigator, "pdfViewerEnabled", "get").mockReturnValue(
    pdfViewer,
  );
}

beforeEach(() => {
  stubDialog();
  if (!("pdfViewerEnabled" in window.navigator)) {
    Object.defineProperty(Navigator.prototype, "pdfViewerEnabled", {
      configurable: true,
      get: () => true,
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderLink() {
  render(<CvLink aria-label="View CV (PDF)">{contact.cv.shortLabel}</CvLink>);
  return screen.getByRole("link", { name: "View CV (PDF)" });
}

describe("canPreviewPdf", () => {
  it("is true on a wide screen with a PDF viewer", () => {
    stubBrowser();
    expect(canPreviewPdf()).toBe(true);
  });

  it("is false on phones and touch-only screens", () => {
    stubBrowser({ phone: true });
    expect(canPreviewPdf()).toBe(false);
  });

  it("is false when the browser has no PDF viewer", () => {
    stubBrowser({ pdfViewer: false });
    expect(canPreviewPdf()).toBe(false);
  });
});

describe("CvLink", () => {
  it("is a download link before it is clicked", () => {
    stubBrowser();
    const link = renderLink();
    expect(link).toHaveAttribute("href", contact.cv.href);
    expect(link).toHaveAttribute("download", contact.cv.fileName);
    expect(link).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the preview with the PDF in a frame on desktop", () => {
    stubBrowser();
    fireEvent.click(renderLink());
    const dialog = screen.getByRole("dialog", { name: copy.title });
    expect(dialog).toHaveAttribute("open");
    const frame = within(dialog).getByTitle(copy.frameTitle);
    expect(frame.tagName).toBe("IFRAME");
    expect(frame.getAttribute("src")).toMatch(/^\/cv\.pdf#/);
    expect(within(dialog).queryByText(copy.fallback)).toBeNull();
    expect(
      within(dialog).getByRole("button", { name: copy.close }),
    ).toHaveFocus();
  });

  it("shows the note with Open and Download instead of a frame on phones", () => {
    stubBrowser({ phone: true });
    fireEvent.click(renderLink());
    const dialog = screen.getByRole("dialog", { name: copy.title });
    expect(within(dialog).queryByTitle(copy.frameTitle)).toBeNull();
    expect(within(dialog).getByText(copy.fallback)).toBeInTheDocument();
    const open = within(dialog).getByRole("link", { name: copy.open });
    expect(open).toHaveAttribute("href", contact.cv.href);
    expect(open).toHaveAttribute("target", "_blank");
    const download = within(dialog).getByRole("link", {
      name: new RegExp(copy.download),
    });
    expect(download).toHaveAttribute("download", contact.cv.fileName);
  });

  it("keeps modified clicks for the browser (new tab, save)", () => {
    stubBrowser();
    const link = renderLink();
    // jsdom cannot follow the link; stop it after React has seen the click.
    const stop = (event: Event) => event.preventDefault();
    document.addEventListener("click", stop);
    onTestFinished(() => document.removeEventListener("click", stop));
    for (const modifier of ["ctrlKey", "metaKey", "shiftKey", "altKey"]) {
      fireEvent.click(link, { [modifier]: true });
    }
    fireEvent.click(link, { button: 1 });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes with the close button and gives focus back to the link", () => {
    stubBrowser();
    const link = renderLink();
    fireEvent.click(link);
    fireEvent.click(screen.getByRole("button", { name: copy.close }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(link).toHaveFocus();
  });

  it("closes on a click on the backdrop, not inside", () => {
    stubBrowser();
    fireEvent.click(renderLink());
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText(copy.title));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(dialog);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("CV preview copy", () => {
  it("is complete and never holds a phone number (D-018)", () => {
    expect(contactSchema.safeParse(contact).success).toBe(true);
    const text = JSON.stringify(contact);
    expect(text).not.toMatch(/\+?\d[\d\s-]{7,}\d/);
    expect(
      contactSchema.safeParse({
        ...contact,
        cv: { ...contact.cv, preview: { ...copy, close: "" } },
      }).success,
    ).toBe(false);
  });
});
