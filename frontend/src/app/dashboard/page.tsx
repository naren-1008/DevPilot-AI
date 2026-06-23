"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { api } from "@/lib/api";
import { 
  FolderPlus, 
  Layers, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Cpu,
  Calendar
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

interface Project {
  id: number;
  name: string;
  description: string;
  tech_stack: string;
  status: "pending" | "running" | "completed" | "failed";
  current_agent: string;
  created_at: string;
}

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    try {
      const data = await api.projects.list();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  if (authLoading || (loading && projects.length === 0)) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center rounded-md bg-yellow-400/10 px-2 py-1 text-xs font-medium text-yellow-500 border border-yellow-500/20">
            Awaiting Run
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center rounded-md bg-blue-400/10 px-2 py-1 text-xs font-medium text-blue-400 border border-blue-400/20">
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            Generating
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-400 border border-emerald-400/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center rounded-md bg-rose-400/10 px-2 py-1 text-xs font-medium text-rose-400 border border-rose-400/20">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </span>
        );
    }
  };

  // Helper to map agent stage progress percentage
  const getProgressPercentage = (status: Project["status"], currentAgent: string) => {
    if (status === "completed") return 100;
    if (status === "failed") return 100;
    if (status === "pending") return 0;
    
    // Map running stages
    const stages = [
      "Requirement Analyst",
      "Software Architect",
      "Frontend Developer",
      "Backend Developer",
      "QA Engineer",
      "Documentation Agent"
    ];
    const index = stages.findIndex(s => currentAgent && currentAgent.includes(s));
    if (index === -1) return 10;
    return Math.round(((index + 1) / stages.length) * 100);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <Navbar />
      
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Your Workspace</h1>
            <p className="text-sm text-zinc-400 mt-1">Create and manage your AI-driven SDLC projects</p>
          </div>
          <Link
            href="/dashboard/wizard"
            className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow cursor-pointer"
          >
            <FolderPlus className="h-5 w-5" />
            <span>New Project Wizard</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
            {error}
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-800 mb-4">
              <Layers className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No projects found</h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
              You haven&apos;t created any software project wizard entries yet. Let AI orchestrators draft your designs.
            </p>
            <Link
              href="/dashboard/wizard"
              className="inline-flex items-center space-x-2 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Create Project Wizard</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const progress = getProgressPercentage(project.status, project.current_agent);
              const formattedDate = new Date(project.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              });
              
              return (
                <div
                  key={project.id}
                  className="glow-border flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-zinc-700 transition"
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {getStatusBadge(project.status)}
                      <span className="flex items-center text-xs text-zinc-500 gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formattedDate}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white line-clamp-1 mb-2">
                      {project.name}
                    </h3>
                    
                    <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                      {project.description || "No description provided."}
                    </p>

                    {project.tech_stack && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {project.tech_stack.split(",").map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center rounded-md bg-zinc-900 px-2 py-0.5 text-xs text-zinc-400 border border-zinc-800"
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Progress section */}
                  <div className="mt-auto pt-4 border-t border-zinc-800/60">
                    <div className="flex justify-between items-center text-xs text-zinc-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                        {project.status === "running" ? (
                          <span className="text-indigo-400 font-medium">Running: {project.current_agent}</span>
                        ) : project.status === "completed" ? (
                          <span>All agents completed</span>
                        ) : project.status === "failed" ? (
                          <span className="text-rose-400 font-medium">Pipeline execution failed</span>
                        ) : (
                          <span>Awaiting trigger</span>
                        )}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-4">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          project.status === "failed" 
                            ? "bg-rose-500" 
                            : project.status === "completed" 
                            ? "bg-emerald-500" 
                            : "bg-indigo-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <Link
                      href={
                        project.status === "pending"
                          ? `/dashboard/project/${project.id}/execute`
                          : project.status === "running"
                          ? `/dashboard/project/${project.id}/execute`
                          : `/dashboard/project/${project.id}/documents`
                      }
                      className="w-full inline-flex items-center justify-center space-x-1.5 rounded-lg bg-zinc-900 border border-zinc-800 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-850 hover:text-white transition"
                    >
                      {project.status === "pending" ? (
                        <>
                          <Play className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>Trigger Agents</span>
                        </>
                      ) : (
                        <>
                          <span>View Workspace</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
