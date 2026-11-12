// Web uses Google's own button (SocialSignIn) and the Android build has NativeGoogleButton.android.tsx.
// iOS stays email-only until Sign in with Apple ships alongside it (App Store guideline 4.8).
export function NativeGoogleButton(_: { webClientId: string; onDone: () => void; onError: (msg: string) => void }) {
  return null;
}
