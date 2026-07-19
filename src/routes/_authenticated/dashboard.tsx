import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  Sparkles,
  FileText,
  Target,
  Briefcase,
  TrendingUp,
  Info,
  ArrowRight,
  Clock,
  Wand2,
  Rocket,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { analyzeResume, listAnalyses } from "@/lib/analysis.functions";
import { extractTextFromFile } from "@/lib/parse-file";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "New Analysis — TailorAI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeResume);
  const listFn = useServerFn(listAnalyses);

  const { data: analyses = [] } = useQuery({
    queryKey: ["analyses"],
    queryFn: () => listFn(),
  });

  const stats = useMemo(() => {
    const total = analyses.length;
    const avg =
      total === 0
        ? 0
        : Math.round(
            analyses.reduce((sum, a) => sum + (a.match_score ?? 0), 0) / total,
          );
    const uniqueJobs = new Set(analyses.map((a) => a.job_title)).size;
    const last = analyses[0];
    return { total, avg, uniqueJobs, last };
  }, [analyses]);

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
    <TooltipProvider delayDuration={150}>
    <div className="mx-auto max-w-7xl p-6 md:p-10 space-y-8">
      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/40 p-8 shadow-sm">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3" /> AI-powered
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Welcome back — let's tailor your next role.
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Drop in your resume and a job description. TailorAI scores your match, spots gaps, and drafts a cover letter in seconds.
            </p>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-lg">
            <Link to="/history">
              View history <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Resumes analyzed"
          value={stats.total}
          icon={FileText}
          accent="from-indigo-500/15 to-indigo-500/0"
          iconClass="text-indigo-500"
        />
        <StatCard
          label="Avg. match score"
          value={stats.total ? `${stats.avg}%` : "—"}
          icon={Target}
          accent="from-emerald-500/15 to-emerald-500/0"
          iconClass="text-emerald-500"
        />
        <StatCard
          label="Unique jobs"
          value={stats.uniqueJobs}
          icon={Briefcase}
          accent="from-violet-500/15 to-violet-500/0"
          iconClass="text-violet-500"
        />
        <StatCard
          label="Last score"
          value={stats.last ? `${stats.last.match_score}%` : "—"}
          icon={TrendingUp}
          accent="from-orange-500/15 to-orange-500/0"
          iconClass="text-orange-500"
          hint={stats.last?.job_title ?? undefined}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
      {/* Editor */}
      <form onSubmit={onSubmit} className="lg:col-span-2 space-y-6">
        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">New analysis</CardTitle>
            </div>
            <CardDescription>Complete both sides, then run the AI.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 md:grid-cols-2">
            {/* Resume column */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Your resume
                </h3>
                <FieldHint text="Upload a .pdf, .docx, or .txt — or paste plain text." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume-title">Title <span className="text-muted-foreground">(optional)</span></Label>
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
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/70 bg-muted/30 p-5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
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
                  rows={12}
                  placeholder="Paste your resume text here — include roles, dates, skills, and impact bullets."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{resumeText.trim().length} characters</p>
              </div>
            </div>

            {/* JD column */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Job description
                </h3>
                <FieldHint text="Copy the full posting — requirements, responsibilities, and any 'nice to haves'." />
              </div>
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
                  rows={16}
                  placeholder="Paste the full job description here…"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{jobDescription.trim().length} characters</p>
              </div>
            </div>
          </CardContent>
          <div className="flex items-center justify-between gap-4 border-t bg-muted/20 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Powered by Gemini via the Lovable AI Gateway. Your data stays private to your account.
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={running}
              className="rounded-lg bg-primary px-8 font-semibold shadow-md shadow-primary/25 transition-all hover:shadow-lg hover:shadow-primary/40"
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
        </Card>
      </form>

      {/* Side panel */}
      <aside className="space-y-6">
        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Getting started</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              { n: 1, t: "Add your resume", d: "Upload a file or paste your latest resume." },
              { n: 2, t: "Paste the job", d: "Copy the full job description you're targeting." },
              { n: 3, t: "Run AI analysis", d: "Get a match score, gaps, and a tailored cover letter." },
            ].map((s) => (
              <div key={s.n} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/20">
                  {s.n}
                </div>
                <div>
                  <p className="font-medium leading-tight">{s.t}</p>
                  <p className="text-muted-foreground">{s.d}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Recent activity</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Link to="/history">All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {analyses.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No analyses yet — your recent runs will show up here.
              </p>
            ) : (
              analyses.slice(0, 5).map((a) => (
                <Link
                  key={a.id}
                  to="/results/$id"
                  params={{ id: a.id }}
                  className="flex items-center justify-between gap-3 rounded-lg border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.job_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                      a.match_score >= 75
                        ? "bg-emerald-500/15 text-emerald-600"
                        : a.match_score >= 50
                          ? "bg-amber-500/15 text-amber-600"
                          : "bg-rose-500/15 text-rose-600",
                    )}
                  >
                    {a.match_score}%
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </aside>
      </div>
    </div>
    </TooltipProvider>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  iconClass,
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconClass: string;
  hint?: string;
}) {
  return (
    <Card className="relative overflow-hidden rounded-xl border-border/60 shadow-sm transition-all hover:shadow-md">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", accent)} />
      <CardContent className="relative flex items-start justify-between p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/80 ring-1 ring-border", iconClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function FieldHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground/70 transition-colors hover:text-foreground" aria-label="Hint">
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

