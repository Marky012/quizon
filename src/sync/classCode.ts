/* ===========================================================================
   THE CLASS CODE.

   A class code is what the teacher writes on the board and the learner types
   in. It is the capability token for uploading into a class: knowing the code
   is what makes an upload land, so it has to be short enough for a child to
   copy off a whiteboard and long enough that a stranger cannot guess it.

   THE FORMAT. Two letters and four digits, for example QZ4821. The teacher
   sees it as "QZ-4821" because that is easier to read aloud and easier to
   write down, and the app stores the bare form so a dash typed or forgotten
   makes no difference.

   THE NORMALISATION IS DONE ON BOTH SIDES. The student app normalises what
   the learner types, and the server normalises the code it is given, so a
   code typed as "qz 4821", "QZ-4821" or "qz4821" is the same code.
   =========================================================================== */

export const CLASS_CODE_LENGTH = 6

/** Uppercase, letters and digits only, capped at the real length. */
export function normalizeClassCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CLASS_CODE_LENGTH)
}

/** "QZ4821" reads as "QZ-4821" on a whiteboard. */
export function formatClassCode(code: string): string {
  const clean = normalizeClassCode(code)
  if (clean.length <= 2) return clean
  return `${clean.slice(0, 2)}-${clean.slice(2)}`
}

/** A code is usable when it is the right length. The server does the real check. */
export function isValidClassCode(code: string): boolean {
  return normalizeClassCode(code).length === CLASS_CODE_LENGTH
}
