/* ===========================================================================
   ROADMAP FLAGS.

   One place to open a teacher- or profile-side feature. The type is `boolean`
   on purpose: type it as the literal `false` and TypeScript narrows the open
   branch to `never`, so the code that waits behind a flag stops being
   type-checked.

   Everything here is CLOSED for now. The student MVP must stay fully usable
   without any of it.
   =========================================================================== */

type FeatureKey = 'teacherSync' | 'profileEdit'

export const FEATURES: Record<FeatureKey, boolean> = {
  teacherSync: false,
  profileEdit: false,
}

/** Shown in Settings as the public "what's next" list. */
export const ROADMAP = [
  'Sync to your teacher',
  'Edit your profile',
  'Music volume slider',
  'Teacher feedback',
  'More reading passages',
  'Bigger text size',
  'Profile photo',
]
