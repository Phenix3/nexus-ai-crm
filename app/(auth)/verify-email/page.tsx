import { SignIn } from "@clerk/nextjs";

// Clerk handles email verification inline inside the SignIn/SignUp flow.
// This page acts as a dedicated landing for the email verification step.
export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <SignIn />
    </div>
  );
}
