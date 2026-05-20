import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/account/login")({ component: LoginPage });

function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-semibold">Login</h1>
      <form className="mt-6 space-y-4 rounded-lg border border-border bg-card p-5">
        <Input type="email" placeholder="Email" />
        <Input type="password" placeholder="Password" />
        <Button className="w-full">Sign in</Button>
        <p className="text-center text-sm text-muted-foreground">New customer? <Link to="/account/register" className="story-link">Create account</Link></p>
      </form>
    </div>
  );
}
