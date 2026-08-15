/**
 * Error codes raised by the Try-On services.
 *
 * The services run below the interface and have no access to the chosen
 * language, so they raise a code and leave the wording to the screen. Throwing
 * a written sentence instead put Hebrew text in front of an English-speaking
 * visitor, because the page rendered `error.message` directly.
 *
 * Codes travel on the `code` property rather than in the message. The message
 * of an error that escapes the network layer is written by the browser
 * ("Failed to fetch") or by the cloud function, and neither belongs on screen.
 * Reading the code and falling back to a general apology keeps unrecognised
 * failures from leaking their internals.
 */
export const TRY_ON_ERRORS = Object.freeze({
  NO_PRODUCT: "TRY_ON_NO_PRODUCT",
  NO_PRODUCT_IMAGE: "TRY_ON_NO_PRODUCT_IMAGE",
  NO_CUSTOMER_IMAGE: "TRY_ON_NO_CUSTOMER_IMAGE",
  REQUEST_FAILED: "TRY_ON_REQUEST_FAILED",
});

/**
 * Builds an error carrying one of the codes above.
 *
 * @param {string} code - A value from TRY_ON_ERRORS.
 * @param {string} [detail] - Technical detail for the console, never shown.
 * @returns {Error} The error to throw.
 */
export function tryOnError(code, detail) {
  const error = new Error(detail || code);
  error.code = code;
  return error;
}
