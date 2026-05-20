import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({ component: PrivacyPolicyPage });

function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">We collect only required order and communication information and handle it with strict confidentiality.</p>
    </div>
  );
}
