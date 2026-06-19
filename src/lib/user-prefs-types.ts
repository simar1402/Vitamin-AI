export interface UserProfilePrefs {
  profession: string;
  contentTypes: string[];
  onboarded: boolean;
  /** First + last name from Google OAuth, stored in Supabase profiles. */
  fullName?: string | null;
}

export function isProfileComplete(profile: UserProfilePrefs | null | undefined): boolean {
  return (
    !!profile?.onboarded &&
    !!profile.profession &&
    (profile.contentTypes?.length ?? 0) > 0
  );
}
