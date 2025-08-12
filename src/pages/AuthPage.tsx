import AuthUI from "@/components/ui/Auth";
import { useEffect } from "react";

export default function AuthPage() {
  useEffect(() => {
    document.title = "Sign In • Cattle Farm Manager";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Sign in to Cattle Farm Manager to record transactions and input costs.');
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section aria-labelledby="auth-heading" className="container mx-auto px-4 py-8">
        <h1 id="auth-heading" className="sr-only">Sign in to Cattle Farm Manager</h1>
        <AuthUI />
      </section>
    </main>
  );
}
