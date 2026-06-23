"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { api } from "@/lib/api";
import { 
  Terminal as ConsoleIcon, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Play,
  FileText
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  description: string;
  tech_stack: string;
  status: "pending" | "running" | "completed" | "failed";
  current_agent: string;
  logs: string;
}

export default function ExecutionConsole() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [error, setError] = useState("");
  
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  const fetchProject = async () => {
    if (!id) return;
    try {
      const data = await api.projects.get(parseInt(id));
      setProject(data);
    } catch (err: any) {
      setError(err.message || "Failed to load execution logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  // Poll logs if status is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (project?.status === "running") {
      interval = setInterval(fetchProject, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [project?.status]);

  // Scroll to bottom of console logs when logs update
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [project?.logs]);

  const handleStartPipeline = async () => {
    if (!project) return;
    setError("");
    setTriggerLoading(true);
    try {
      await api.projects.generate(project.id);
      fetchProject();
    } catch (err: any) {
      setError(err.message || "Failed to start agent pipeline.");
    } finally {
      setTriggerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <h2 className="text-xl font-bold text-white mb-2">Project not found</h2>
          <button 
            onClick={() => router.push("/dashboard")}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:text-white"
          >
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <Navbar />
      
      <div className="flex flex-1">
        <Sidebar projectId={project.id} />
        
        <main className="flex-1 p-8 flex flex-col max-w-5xl h-[calc(100vh-4rem)] overflow-y-auto">
          {error && (
            <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/25 p-4 text-sm text-rose-400">
              {error}
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <ConsoleIcon className="h-6 w-6 text-indigo-400" />
                <span>Execution Console</span>
              </h1>
              <p className="text-sm text-zinc-400 mt-1">Monitor real-time logs from agent graph steps.</p>
            </div>
            
            <div className="flex items-center gap-3">
              {project.status === "pending" && (
                <button
                  onClick={handleStartPipeline}
                  disabled={triggerLoading}
                  className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {triggerLoading ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                  ) : (
                    <Play className="h-4 w-4 fill-white" />
                  )}
                  <span>Launch Agents</span>
                </button>
              )}
              {project.status === "completed" && (
                <button
                  onClick={() => router.push(`/dashboard/project/${project.id}/documents`)}
                  className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>View Code & Docs</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Status Ribbon */}
          <div className={`flex items-center justify-between border p-4 rounded-xl mb-6 text-sm ${
            project.status === "running"
              ? "bg-blue-950/20 border-blue-900/40 text-blue-400"
              : project.status === "completed"
              ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
              : project.status === "failed"
              ? "bg-rose-950/20 border-rose-900/40 text-rose-400"
              : "bg-zinc-900/50 border-zinc-800 text-zinc-400"
          }`}>
            <span className="flex items-center gap-2">
              {project.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
              {project.status === "completed" && <CheckCircle className="h-4 w-4 text-emerald-400" />}
              {project.status === "failed" && <AlertTriangle className="h-4 w-4 text-rose-400" />}
              <span>
                {project.status === "running"
                  ? `Active Agent: ${project.current_agent}`
                  : project.status === "completed"
                  ? "All SDLC agents completed execution successfully."
                  : project.status === "failed"
                  ? "Agent pipeline execution stopped due to an error."
                  : "Awaiting manual pipeline launch trigger."}
              </span>
            </span>
            <span className="font-semibold capitalize text-xs tracking-wider">
              {project.status}
            </span>
          </div>

          {/* Console Output Screen */}
          <div className="flex-1 min-h-[400px] bg-black border border-zinc-800 rounded-xl p-5 font-mono text-sm overflow-y-auto flex flex-col justify-between">
            <div className="space-y-2 whitespace-pre-wrap leading-relaxed text-zinc-300">
              {project.logs ? (
                project.logs.split("\n").map((line, idx) => {
                  let colorClass = "text-zinc-300";
                  if (line.includes("Error") || line.includes("failed")) colorClass = "text-rose-400";
                  else if (line.includes("Completed successfully") || line.includes("finished")) colorClass = "text-emerald-400";
                  else if (line.includes("Agent:")) colorClass = "text-indigo-400 font-bold";
                  
                  return (
                    <div key={idx} className={colorClass}>
                      <span className="text-zinc-650 select-none mr-2">[{idx + 1}]</span>
                      {line}
                    </div>
                  );
                })
              ) : (
                <div className="text-zinc-600">Console empty. Ready for agent stream.</div>
              )}
              <div ref={consoleBottomRef} />
            </div>
            
            {project.status === "running" && (
              <div className="mt-4 pt-4 border-t border-zinc-900 flex items-center text-xs text-indigo-400 gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Streaming logs from Gemini execution graph...</span>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
