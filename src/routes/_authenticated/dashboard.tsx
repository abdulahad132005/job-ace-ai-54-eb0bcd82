import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Upload, Loader2, Sparkles } from "lucide-react";
import { analyzeResume } from "@/lib/analysis.functions";
import { extractTextFromFile } from "@/lib/parse-file";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "New Analysis — TailorAI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeResume);

  const [resumeText, setResumeText] = useState("");
  const [resumeTitle, setResumeTitle] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [parsing, setParsing] = useState(false);
  const [running, setRunning] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) throw new Error("No text extracted from file.");
      setResumeText(text);
      if (!resumeTitle) setResumeTitle(file.name.replace(/\.[^.]+$/, ""));
      toast.success("Resume loaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resumeText.trim().length < 30) return toast.error("Resume is too short.");
    if (jobDescription.trim().length < 30)
      return toast.error("Job description is too short.");
    if (!jobTitle.trim()) return toast.error("Job title is required.");

    setRunning(true);
    try {
      const res = await analyze({
        data: {
          resumeText,
          resumeTitle: resumeTitle || undefined,
          jobTitle,
          jobDescription,
        },
      });
      navigate({ to: "/results/$id", params: { id: res.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-8 md:p-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">New Analysis</h1>
        <p className="mt-2 text-muted-foreground">
          Upload or paste your resume, then paste the job description.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-2">
        <Card className="rounded-xl border-border/60 shadow-sm shadow-slate-200/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Your resume</CardTitle>
            <CardDescription>Upload a .pdf, .docx, or .txt — or paste text.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="resume-title">Title (optional)</Label>
              <Input
                id="resume-title"
                placeholder="e.g. Senior Engineer resume"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
              />
            </div>
            <div>
              <Label
                htmlFor="resume-file"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/70 bg-muted/30 p-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
              >
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Parsing…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Upload .pdf / .docx / .txt
                  </>
                )}
              </Label>
              <input
                id="resume-file"
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="sr-only"
                onChange={onFile}
                disabled={parsing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume-text">Resume content</Label>
              <Textarea
                id="resume-text"
                rows={14}
                placeholder="Paste or edit your resume here…"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 shadow-sm shadow-slate-200/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Job description</CardTitle>
            <CardDescription>Paste the full job posting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job title</Label>
              <Input
                id="job-title"
                placeholder="e.g. Senior Frontend Engineer at Acme"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-desc">Description</Label>
              <Textarea
                id="job-desc"
                rows={18}
                placeholder="Paste the job description here…"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={running}
            className="rounded-lg px-8 shadow-sm shadow-primary/20 transition-all hover:shadow-md hover:shadow-primary/30"
          >
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Analyze with AI
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}