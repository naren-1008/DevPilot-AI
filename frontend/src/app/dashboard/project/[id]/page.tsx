"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { api } from "@/lib/api";
import { 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Calendar, 
  Code2, 
  FileText,
  Play
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  description: string;
  tech_stack: string;
  status: "pending" | "running" | "completed" | "failed";
  current_agent: string;
  created_at: string;
  updated_at: string;
  logs: string;
}

export default function ProjectOverview() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProject = async () => {
    if (!id) return;
    try {
      const data = await api.projects.get(parseInt(id));
      setProject(data);
    } catch (err: any) {
      setError(err.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    
    // If running, poll every 3 seconds to update overview
    let interval: NodeJS.Timeout;
    if (project?.status === "running") {
      interval = setInterval(fetchProject, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id, project?.status]);

  const handleTriggerRun = async () => {
    if (!project) return;
    setError("");
    setTriggerLoading(true);
    try {
      await api.projects.generate(project.id);
      router.push(`/dashboard/project/${project.id}/execute`);
    } catch (err: any) {
      setError(err.message || "Failed to trigger agent pipeline.");
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
          <p className="text-sm text-zinc-400 mb-6">The requested workspace parameters could not be retrieved.</p>
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

  const stages = [
    { key: "Requirement", name: "Requirement Analyst", desc: "SRS & User Stories" },
    { key: "Architect", name: "Software Architect", desc: "Tech Stack & Mermaid" },
    { key: "Frontend", name: "Frontend Developer", desc: "Component structures" },
    { key: "Backend", name: "Backend Developer", desc: "REST Endpoints" },
    { key: "QA", name: "QA Engineer", desc: "Tests & Scenarios" },
    { key: "Doc", name: "Documentation Agent", desc: "README & cloud setup" },
  ];

  // Helper to determine status icon for stages
  const getStageStatus = (stageName: string) => {
    if (project.status === "completed") return "completed";
    if (project.status === "pending") return "pending";
    
    // If failed, check if this stage had been processed
    const stagesList = stages.map(s => s.name);
    const currentIndex = stagesList.indexOf(project.current_agent);
    const stageIndex = stagesList.indexOf(stageName);
    
    if (project.status === "failed") {
      if (stageIndex < currentIndex) return "completed";
      if (stageIndex === currentIndex) return "failed";
      return "pending";
    }
    
    if (project.status === "running") {
      if (stageIndex < currentIndex) return "completed";
      if (stageIndex === currentIndex) return "running";
      return "pending";
    }
    return "pending";
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <Navbar />
      
      <div className="flex flex-1">
        <Sidebar projectId={project.id} />
        
        <main className="flex-1 p-8 overflow-y-auto max-w-5xl">
          {error && (
            <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/25 p-4 text-sm text-rose-400">
              {error}
            </div>
          )}

          {/* Project Details Banner */}
          <div className="border border-zinc-800 bg-zinc-900/10 p-8 rounded-2xl mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white mb-2">{project.name}</h1>
                <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">{project.description}</p>
              </div>
              
              {project.status === "pending" && (
                <button
                  onClick={handleTriggerRun}
                  disabled={triggerLoading}
                  className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow disabled:opacity-50 cursor-pointer"
                >
                  {triggerLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Play className="h-4 w-4 fill-white" />
                  )}
                  <span>Trigger Pipeline</span>
                </button>
              )}

              {project.status === "running" && (
                <button
                  onClick={() => router.push(`/dashboard/project/${project.id}/execute`)}
                  className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 px-5 py-2.5 text-sm font-semibold hover:bg-indigo-600/20 transition cursor-pointer"
                >
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  <span>View Console</span>
                </button>
              )}

              {project.status === "completed" && (
                <button
                  onClick={() => router.push(`/dashboard/project/${project.id}/documents`)}
                  className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>View Documents</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-zinc-800/60 text-xs text-zinc-400">
              <div>
                <span className="block text-zinc-500 font-medium mb-1">Status</span>
                <span className="capitalize font-semibold text-zinc-200">{project.status}</span>
              </div>
              <div>
                <span className="block text-zinc-500 font-medium mb-1">Tech Preferences</span>
                <span className="font-semibold text-zinc-200">{project.tech_stack || "AI Decides"}</span>
              </div>
              <div>
                <span className="block text-zinc-500 font-medium mb-1">Created At</span>
                <span className="font-semibold text-zinc-200">
                  {new Date(project.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-zinc-500 font-medium mb-1">Last Update</span>
                <span className="font-semibold text-zinc-200">
                  {new Date(project.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Stepper details */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Agent SDLC pipeline Timeline</h2>
            
            <div className="relative border-l border-zinc-850 ml-4 space-y-8 pb-4">
              {stages.map((stage) => {
                const sStatus = getStageStatus(stage.name);
                
                return (
                  <div key={stage.name} className="relative pl-8">
                    {/* Circle icon marker */}
                    <span className={`absolute -left-[13px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                      sStatus === "completed" 
                        ? "bg-emerald-950 border-emerald-500 text-emerald-400" 
                        : sStatus === "running"
                        ? "bg-indigo-950 border-indigo-500 text-indigo-400 pulse-ring"
                        : sStatus === "failed"
                        ? "bg-rose-950 border-rose-500 text-rose-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500"
                    }`}>
                      {sStatus === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {sStatus === "running" && <Cpu className="h-3.5 w-3.5 animate-pulse" />}
                      {sStatus === "failed" && <XCircle className="h-3.5 w-3.5" />}
                      {sStatus === "pending" && <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />}
                    </span>
                    
                    <div>
                      <h3 className={`text-base font-bold ${
                        sStatus === "running" ? "text-indigo-400" : sStatus === "completed" ? "text-zinc-200" : "text-zinc-500"
                      }`}>
                        {stage.name}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{stage.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
