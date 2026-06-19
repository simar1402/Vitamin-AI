import { redirect } from "next/navigation";

// Legacy route — redirect to the new onboarding flow
export default function InterestsRedirect() {
  redirect("/onboarding");
}
