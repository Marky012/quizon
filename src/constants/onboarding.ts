/* ===========================================================================
   THE SETUP SPINE - the seven stops between the boot splash and the Hub.

   ONE INDICATOR, SEVEN DOTS, THREE SCREENS. Before 2026-10-22 each screen kept
   its own little progress story - Welcome had none, Profile had none, and the
   Intro had three dots that only counted the Intro's own panels. A child saw
   "1 of 3" in the middle of a first run that was about to ask four more
   questions, which is a lie by omission.

   The stops, in order:

     1  the eight-helper picker            /welcome
     2  the player (girl or boy)           /profile, panel 0
     3  the official full name             /profile, panel 1
     4  the nickname                       /profile, panel 2
     5  the storm                          /intro, panel 0
     6  the mixed-up texts                 /intro, panel 1
     7  the eight helpers                  /intro, panel 2  -> "Go to the hub"

   The numbers live here rather than in each screen's call site so the three
   screens cannot drift apart: adding a stop is one edit to this file plus the
   screen that owns it, not three guesses.
   =========================================================================== */

/** Every stop from the helper picker to the last story panel, inclusive. */
export const ONBOARDING_TOTAL = 7

/** The helper picker - the first screen that shows the indicator. */
export const STEP_HELPER = 0

/** Panel 0 of the Profile screen. Panels 1 and 2 are this plus one and two. */
export const STEP_PROFILE = 1

/** Panel 0 of the Intro. Panels 1 and 2 are this plus one and two. */
export const STEP_STORY = 4
