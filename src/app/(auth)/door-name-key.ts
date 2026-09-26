/**
 * The `signInWithOtp` data key the guest door stores a typed name under, so a tapped magic link can
 * still name the account it creates: `/auth/callback` adopts it (adopt-door-name.ts). Its own
 * client-safe module because the door that writes it is a client component and the module that
 * reads it is server-only.
 */
export const DOOR_NAME_KEY = "door_name";
