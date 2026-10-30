import { Command } from "cmdk";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { projects } from "~/lib/projects";
import { nextSkin, switchSkin } from "~/lib/skin";
import { setTheme } from "~/lib/theme";
import { useSkin } from "~/lib/useSkin";
import { useTheme } from "~/lib/useTheme";

import { contact } from "../../../content/contact";
import { site } from "../../../content/site";

const copy = site.commandPalette;

// Starts the CV download the header link offers, from a command.
export function downloadCv(): void {
  const link = document.createElement("a");
  link.href = contact.cv.href;
  link.download = contact.cv.fileName;
  link.type = "application/pdf";
  document.body.append(link);
  link.click();
  link.remove();
}

export interface CommandPaletteProps {
  open: boolean;
  // Called after the dialog has closed, however it was closed.
  onClosed: () => void;
  // A polite status message after a command that changes the page in place.
  onAnnounce: (message: string) => void;
}

const itemClass =
  "flex cursor-pointer items-center justify-between gap-4 rounded-md border-l-2 border-transparent px-3 py-2 text-sm text-fg-muted data-[selected=true]:border-accent data-[selected=true]:bg-surface-raised data-[selected=true]:text-fg";

const groupClass =
  "px-1 py-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-fg-muted";

// The command palette (T-043): go to a page or case study, switch the design
// or the theme, download the CV. A native modal <dialog> keeps focus inside
// and makes the page behind it inert; cmdk provides the combobox and the
// filtered list (D-036). Loaded lazily by CommandMenu.
export default function CommandPalette({
  open,
  onClosed,
  onAnnounce,
}: CommandPaletteProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const skin = useSkin();
  const theme = useTheme();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      // Browsers differ on what a modal dialog focuses first; the search
      // field is always the place to start.
      input.current?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  // Closes the dialog first, so focus is back on the page when the command
  // runs (a navigation, a view transition or a download).
  function run(command: () => void) {
    dialog.current?.close();
    command();
  }

  const pages = [{ label: copy.home, href: "/" }, ...site.navigation];
  const otherSkin = skin === null ? null : nextSkin(skin);
  const otherTheme = theme === "dark" ? "light" : "dark";

  return (
    // A click on the backdrop closes the dialog. Pointer-only on purpose:
    // the keyboard equivalent is Escape, which the native dialog handles.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialog}
      aria-label={copy.label}
      onClose={() => {
        setSearch("");
        onClosed();
      }}
      // A click on the backdrop lands on the dialog itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
      className="mx-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-surface p-0 text-fg backdrop:bg-fg/40"
    >
      <Command label={copy.inputLabel} loop>
        <Command.Input
          ref={input}
          value={search}
          onValueChange={setSearch}
          placeholder={copy.placeholder}
          className="w-full border-b border-line bg-transparent px-4 py-3 text-base text-fg placeholder:text-fg-muted focus-visible:-outline-offset-2"
        />
        <Command.List
          label={copy.listLabel}
          className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain"
        >
          <Command.Empty className="px-4 py-6 text-center text-sm text-fg-muted">
            {copy.empty}
          </Command.Empty>
          <Command.Group heading={copy.groups.pages} className={groupClass}>
            {pages.map((page) => (
              <Command.Item
                key={page.href}
                value={`${page.label} ${page.href}`}
                onSelect={() => run(() => void navigate(page.href))}
                className={itemClass}
              >
                {page.label}
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading={copy.groups.work} className={groupClass}>
            {projects.map((project) => (
              <Command.Item
                key={project.slug}
                value={`${project.title} ${project.sector} ${copy.caseStudy}`}
                onSelect={() =>
                  run(() => void navigate(`/work/${project.slug}`))
                }
                className={itemClass}
              >
                <span>{project.title}</span>
                <span className="hidden shrink-0 font-mono text-xs text-fg-muted sm:inline">
                  {project.sector}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group
            heading={copy.groups.preferences}
            className={groupClass}
          >
            {otherSkin && (
              <Command.Item
                value={copy.switchDesign.replace(
                  "{design}",
                  site.skinSwitcher.names[otherSkin],
                )}
                onSelect={() =>
                  run(() => {
                    void switchSkin(otherSkin).then(() =>
                      onAnnounce(
                        site.skinSwitcher.switched.replace(
                          "{design}",
                          site.skinSwitcher.names[otherSkin],
                        ),
                      ),
                    );
                  })
                }
                className={itemClass}
              >
                {copy.switchDesign.replace(
                  "{design}",
                  site.skinSwitcher.names[otherSkin],
                )}
              </Command.Item>
            )}
            {theme !== null && (
              <Command.Item
                value={copy.theme[otherTheme]}
                onSelect={() =>
                  run(() => {
                    setTheme(otherTheme);
                    onAnnounce(copy.themeOn[otherTheme]);
                  })
                }
                className={itemClass}
              >
                {copy.theme[otherTheme]}
              </Command.Item>
            )}
          </Command.Group>
          <Command.Group heading={copy.groups.files} className={groupClass}>
            <Command.Item
              value={`${contact.cv.label} ${contact.cv.format}`}
              onSelect={() => run(downloadCv)}
              className={itemClass}
            >
              <span>{contact.cv.label}</span>
              <span className="font-mono text-xs text-fg-muted">
                {contact.cv.format}
              </span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </dialog>
  );
}
