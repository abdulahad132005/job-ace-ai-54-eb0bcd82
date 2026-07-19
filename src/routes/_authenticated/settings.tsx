import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — TailorAI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState<string>("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8 md:p-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">Account and AI service configuration.</p>
      </div>

      <Card className="rounded-xl border-border/60 shadow-sm shadow-slate-200/50">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>You are signed in as:</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-md bg-muted/60 px-3 py-2 font-mono text-sm">{email || "—"}</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border/60 shadow-sm shadow-slate-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            AI Service — Active
          </CardTitle>
          <CardDescription>
            This app uses the Lovable AI Gateway (Google Gemini) for resume
            analysis and cover-letter generation. It's ready to use out of the
            box — no API key entry required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                Want to use your own Gemini API key instead?
              </p>
              <p className="mt-1">
                Edit{" "}
                <code className="rounded bg-background px-1 py-0.5">
                  src/lib/ai-gateway.server.ts
                </code>{" "}
                and swap the fetch call to Google's Generative Language API. Read
                the key from{" "}
                <code className="rounded bg-background px-1 py-0.5">
                  process.env.GEMINI_API_KEY
                </code>{" "}
                — add it via the Lovable secrets manager. Never hardcode API
                keys in source code.
              </p>
            </div>
          </div>
          <p>
            Current model:{" "}
            <code className="rounded bg-muted px-1 py-0.5">google/gemini-3.5-flash</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}