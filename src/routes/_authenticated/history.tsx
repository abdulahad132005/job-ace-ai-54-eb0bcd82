import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAnalyses, deleteAnalysis } from "@/lib/analysis.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — TailorAI" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const list = useServerFn(listAnalyses);
  const del = useServerFn(deleteAnalysis);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["analyses"],
    queryFn: () => list(),
  });

  const remove = async (id: string) => {
    if (!confirm("Delete this analysis?")) return;
    try {
      await del({ data: { id } });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["analyses"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground">Your previous analyses.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard">New analysis</Link>
        </Button>
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !q.data || q.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No analyses yet.</p>
            <Button asChild>
              <Link to="/dashboard">Create your first one</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {q.data.map((row) => (
            <Card key={row.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="min-w-0">
                  <CardTitle className="truncate text-lg">
                    {row.job_title || "Untitled role"}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      row.match_score >= 75
                        ? "default"
                        : row.match_score >= 50
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {row.match_score}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/results/$id" params={{ id: row.id }}>
                    View
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(row.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}