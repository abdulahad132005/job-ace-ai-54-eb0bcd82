import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGeminiJSON, type ChatMessage } from "./ai-gateway.server";

const AnalyzeInput = z.object({
  resumeText: z.string().min(30, "Resume seems too short."),
  resumeTitle: z.string().max(200).optional(),
  jobTitle: z.string().min(1).max(200),
  jobDescription: z.string().min(30, "Job description seems too short."),
});

interface AiFeedback {
  match_score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  keyword_matches: string[];
  missing_keywords: string[];
  suggestions: string[];
  cover_letter: string;
}

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => AnalyzeInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are an expert career coach and ATS resume analyst. Analyze a resume against a job description and return ONLY a JSON object matching this exact schema (no markdown, no commentary):\n" +
          '{\n  "match_score": integer 0-100,\n  "summary": string (2-3 sentences),\n  "strengths": string[] (3-6 items),\n  "gaps": string[] (3-6 items describing key missing skills or experience),\n  "keyword_matches": string[] (keywords found in both),\n  "missing_keywords": string[] (important keywords in the JD missing from the resume),\n  "suggestions": string[] (3-6 concrete resume improvements),\n  "cover_letter": string (a tailored, ready-to-send cover letter, ~250-350 words, professional tone, first person)\n}',
      },
      {
        role: "user",
        content: `JOB TITLE:\n${data.jobTitle}\n\nJOB DESCRIPTION:\n${data.jobDescription}\n\n---\n\nRESUME:\n${data.resumeText}`,
      },
    ];

    const ai = await callGeminiJSON<AiFeedback>(messages);

    // Persist resume + JD + result
    const { data: resumeRow, error: rErr } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        title: data.resumeTitle ?? "Untitled resume",
        content_text: data.resumeText,
      })
      .select("id")
      .single();
    if (rErr) throw new Error(rErr.message);

    const { data: jdRow, error: jErr } = await supabase
      .from("job_descriptions")
      .insert({
        user_id: userId,
        title: data.jobTitle,
        description_text: data.jobDescription,
      })
      .select("id")
      .single();
    if (jErr) throw new Error(jErr.message);

    const score = Math.max(0, Math.min(100, Math.round(ai.match_score ?? 0)));

    const { data: resultRow, error: aErr } = await supabase
      .from("analysis_results")
      .insert({
        user_id: userId,
        resume_id: resumeRow.id,
        job_description_id: jdRow.id,
        job_title: data.jobTitle,
        match_score: score,
        feedback: {
          summary: ai.summary ?? "",
          strengths: ai.strengths ?? [],
          gaps: ai.gaps ?? [],
          keyword_matches: ai.keyword_matches ?? [],
          missing_keywords: ai.missing_keywords ?? [],
          suggestions: ai.suggestions ?? [],
        },
        generated_cover_letter: ai.cover_letter ?? "",
      })
      .select("id")
      .single();
    if (aErr) throw new Error(aErr.message);

    return { id: resultRow.id as string };
  });

export const listAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("analysis_results")
      .select("id, job_title, match_score, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("analysis_results")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Analysis not found");
    return row;
  });

export const deleteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("analysis_results")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });