import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAnalysis } from "@/lib/analysis.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, Copy, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/results/$id")({
  head: () => ({ meta: [{ title: "Analysis Result — TailorAI" }] }),
  component: ResultsPage,
});

interface Feedback {
  summary?: string;
  strengths?: string[];
  gaps?: string[];
  keyword_matches?: string[];
  missing_keywords?: string[];
  suggestions?: string[];
}

function ResultsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchFn = useServerFn(getAnalysis);

  const q = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetchFn({ data: { id } }),
  });

  if (q.isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (q.error || !q.data) {
    return (
      <div className="p-8">
        <p className="text-destructive">Failed to load analysis.</p>
        <Button onClick={() => navigate({ to: "/history" })} className="mt-4">
          Back to history
        </Button>
      </div>
    );
  }

  const row = q.data as {
    job_title: string;
    match_score: number;
    feedback: Feedback;
    generated_cover_letter: string | null;
    created_at: string;
  };
  const fb = (row.feedback ?? {}) as Feedback;

  const scoreColor =
    row.match_score >= 75
      ? "text-emerald-600"
      : row.match_score >= 50
        ? "text-amber-600"
        : "text-red-600";

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> New analysis
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/history">View history</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{row.job_title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-4">
            <div className={`text-6xl font-bold ${scoreColor}`}>
              {row.match_score}
            </div>
            <div className="text-muted-foreground">/ 100 match score</div>
          </div>
          <Progress value={row.match_score} className="h-3" />
          {fb.summary && <p className="text-muted-foreground">{fb.summary}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <ListCard title="Strengths" items={fb.strengths} icon="check" />
        <ListCard title="Key gaps" items={fb.gaps} icon="x" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <KeywordCard title="Matched keywords" items={fb.keyword_matches} variant="matched" />
        <KeywordCard title="Missing keywords" items={fb.missing_keywords} variant="missing" />
      </div>

      {fb.suggestions && fb.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suggestions to improve your resume</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-decimal space-y-2 text-sm">
              {fb.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {row.generated_cover_letter && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tailored Cover Letter</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(row.generated_cover_letter!)}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {row.generated_cover_letter}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ListCard({
  title,
  items,
  icon,
}: {
  title: string;
  items?: string[];
  icon: "check" | "x";
}) {
  if (!items || items.length === 0) return null;
  const Icon = icon === "check" ? CheckCircle2 : XCircle;
  const color = icon === "check" ? "text-emerald-600" : "text-red-600";
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${color}`} />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function KeywordCard({
  title,
  items,
  variant,
}: {
  title: string;
  items?: string[];
  variant: "matched" | "missing";
}) {
  if (!items || items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {items.map((k, i) => (
            <Badge
              key={i}
              variant={variant === "matched" ? "default" : "destructive"}
            >
              {k}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}