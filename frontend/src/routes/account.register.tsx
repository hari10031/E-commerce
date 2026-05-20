import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/account/register")({ component: RegisterPage });

function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-semibold">Create Account</h1>
      <form className="mt-6 space-y-4 rounded-lg border border-border bg-card p-5">
        <Input placeholder="Full Name" />
        <Input type="email" placeholder="Email" />
        <Input type="password" placeholder="Password" />
        <Button className="w-full">Register</Button>
        <p className="text-center text-sm text-muted-foreground">Already have an account? <Link to="/account/login" className="story-link">Login</Link></p>
      </form>
    </div>
  );
}
