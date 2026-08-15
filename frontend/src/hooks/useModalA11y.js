import { useEffect, useId, useRef } from "react";
import { useEscapeKey } from "./useEscapeKey";

/**
 * Gives a modal the parts of dialog behaviour a keyboard or screen reader user
 * depends on.
 *
 * Three things, applied the same way everywhere so fifteen modals cannot drift
 * apart:
 *
 * 1. **Announced as a dialog.** `role="dialog"` with `aria-modal` tells a
 *    screen reader that the content behind is out of play, and
 *    `aria-labelledby` gives the dialog its name. Without the label the
 *    reader announces "dialog" and nothing else.
 * 2. **Escape closes it.** Reaching for Escape is the first thing anyone tries
 *    when a dialog is in the way, and it was the one thing most of these had
 *    no answer for.
 * 3. **Focus moves in and back out.** On open, focus lands on the first
 *    control inside; on close it returns to whatever opened the dialog, so the
 *    keyboard does not jump back to the top of the page.
 *
 * What it deliberately does not do is trap focus. Tab still walks out of the
 * dialog and into the page behind it. That needs its own handling and is
 * recorded as a known limitation.
 *
 * @param {object} options - Hook options.
 * @param {boolean} [options.isOpen] - Whether the dialog is showing. Modals
 * that return null when closed can leave this at its default.
 * @param {Function} options.onClose - Called on Escape.
 * @returns {{dialogRef: object, dialogProps: object, titleProps: object}}
 * A ref for the dialog box, props to spread on it, and props for its heading.
 */
export function useModalA11y({ isOpen = true, onClose }) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);
  const titleId = useId();

  useEscapeKey(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocused.current = document.activeElement;

    const dialog = dialogRef.current;

    if (!dialog) return undefined;

    // A dialog box is usually a div, which cannot hold focus on its own.
    if (!dialog.hasAttribute("tabindex")) {
      dialog.setAttribute("tabindex", "-1");
    }

    const firstControl = dialog.querySelector(
      "input:not([type='hidden']):not([disabled]), textarea:not([disabled])," +
        " select:not([disabled]), button:not([disabled]), [href]"
    );

    (firstControl || dialog).focus?.();

    return () => {
      // Returns the keyboard to whatever opened the dialog. Without this it
      // restarts from the top of the document.
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  return {
    dialogRef,
    dialogProps: {
      role: "dialog",
      "aria-modal": true,
      "aria-labelledby": titleId,
    },
    titleProps: { id: titleId },
  };
}
