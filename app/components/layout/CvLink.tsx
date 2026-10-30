import { useEffect, useRef, useState, type MouseEvent } from "react";

import { Button, ButtonLink, type ButtonLinkProps } from "~/components/ui";

import { contact } from "../../../content/contact";

const cv = contact.cv;
const copy = cv.preview;

// Phones and narrow windows get the note instead of the frame: Android
// Chrome has no inline PDF viewer, and iOS Safari shows only a fixed first
// page in a frame. Wide touch-only screens (tablets) count as phones too.
export const NO_INLINE_PDF_QUERY =
  "(max-width: 39.99rem), (hover: none) and (pointer: coarse)";

// Whether the preview can show the PDF inline (T-056, D-046). Browsers
// without a built-in PDF viewer say so through navigator.pdfViewerEnabled.
export function canPreviewPdf(): boolean {
  if (typeof window === "undefined") return false;
  if (window.navigator.pdfViewerEnabled === false) return false;
  return !window.matchMedia(NO_INLINE_PDF_QUERY).matches;
}

// A plain left click opens the preview; modified and middle clicks keep the
// link's own behaviour (download, new tab or window).
function isPlainClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export type CvLinkProps = Omit<
  ButtonLinkProps,
  "href" | "download" | "type" | "onClick"
>;

// The CV link of the header and the home contact card (T-056). It is a real
// download link, so it works before hydration and without JavaScript; once
// hydrated, a click opens the preview dialog instead.
export function CvLink(props: CvLinkProps) {
  const [open, setOpen] = useState(false);
  const [inline, setInline] = useState(false);
  // The link that opened the dialog, which gets focus back when it closes.
  const trigger = useRef<HTMLAnchorElement | null>(null);

  return (
    <>
      <ButtonLink
        href={cv.href}
        download={cv.fileName}
        type="application/pdf"
        aria-haspopup="dialog"
        onClick={(event) => {
          if (!isPlainClick(event)) return;
          event.preventDefault();
          trigger.current = event.currentTarget;
          setInline(canPreviewPdf());
          setOpen(true);
        }}
        {...props}
      />
      {open && (
        <CvDialog
          inline={inline}
          onClosed={() => {
            setOpen(false);
            trigger.current?.focus();
          }}
        />
      )}
    </>
  );
}

interface CvDialogProps {
  // Show the PDF in a frame, or the note for browsers that cannot.
  inline: boolean;
  // Called once the dialog has closed, however it was closed.
  onClosed: () => void;
}

// A native modal <dialog>: the page behind it is inert, so focus stays
// inside; Escape closes it. Mounted only while open, so the PDF is fetched
// only when asked for.
export function CvDialog({ inline, onClosed }: CvDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element || element.open) return;
    element.showModal();
    // Browsers differ on what a modal dialog focuses first.
    element.querySelector<HTMLElement>("[data-cv-close]")?.focus();
  }, []);

  return (
    // A click on the backdrop closes the dialog. Pointer-only on purpose:
    // the keyboard equivalents are Escape and the close button.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialog}
      aria-labelledby="cv-preview-title"
      onClose={onClosed}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-line bg-surface p-0 text-fg backdrop:bg-fg/40 open:flex"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <h2 id="cv-preview-title" className="text-lg">
          {copy.title}
        </h2>
        <Button
          data-cv-close
          variant="secondary"
          size="sm"
          onClick={() => dialog.current?.close()}
        >
          {copy.close}
        </Button>
      </div>
      {inline ? (
        <iframe
          src={`${cv.href}#view=FitH`}
          title={copy.frameTitle}
          className="h-[70dvh] w-full bg-surface-raised"
        />
      ) : (
        <p className="px-4 pt-4 text-fg-muted">{copy.fallback}</p>
      )}
      <div className="flex flex-wrap justify-end gap-3 px-4 py-4">
        <ButtonLink
          href={cv.href}
          target="_blank"
          rel="noopener"
          type="application/pdf"
          variant="secondary"
        >
          {copy.open}
        </ButtonLink>
        <ButtonLink
          href={cv.href}
          download={cv.fileName}
          type="application/pdf"
        >
          {copy.download}
          <span className="font-mono text-xs">{cv.format}</span>
        </ButtonLink>
      </div>
    </dialog>
  );
}
