import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — TailorAI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      const meta = (data.user?.user_metadata ?? {}) as { display_name?: string; full_name?: string; name?: string };
      setDisplayName(meta.display_name ?? meta.full_name ?? meta.name ?? "");
    });
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates: { email?: string; data?: Record<string, unknown> } = {
        data: { display_name: displayName },
      };
      const { data: current } = await supabase.auth.getUser();
      if (email && email !== current.user?.email) updates.email = email;
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      toast.success(
        updates.email
          ? "Profile updated — check your inbox to confirm the new email."
          : "Profile updated",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-8 md:p-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1>
        <p className="mt-2 text-muted-foreground">Account and AI service configuration.</p>
      </div>

      <Card className="rounded-xl border-border/60 shadow-sm shadow-slate-200/50">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name and email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                placeholder="Jane Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Changing your email requires confirmation via a link sent to the new address.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="rounded-lg">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </form>
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