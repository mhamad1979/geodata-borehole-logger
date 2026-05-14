"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      
      // Check if there's a session (handles both code exchange and hash fragment)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session && !error) {
        router.push("/dashboard");
      } else {
        // Try to exchange code if present in URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeError) {
            router.push("/dashboard");
            return;
          }
        }
        
        router.push("/login");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
