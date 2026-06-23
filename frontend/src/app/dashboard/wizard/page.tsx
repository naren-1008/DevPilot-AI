"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { api } from "@/lib/api";
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Folder, 
  Cpu, 
  Loader2,
  CheckCircle,
  Database,
  Code2
} from "lucide-react";

export default function NewProjectWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [framework, setFramework] = useState("Next.js, FastAPI");
  const [databaseType, setDatabaseType] = useState("PostgreSQL");
  const [aiDecision, setAiDecision] = useState(true);

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      setError("Project Name is required.");
      return;
    }
    if (step === 1 && !description.trim()) {
      setError("Please describe your project idea.");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleCreate = async () => {
    setError("");
    setLoading(true);
    try {
      const techStackString = aiDecision 
        ? "AI Decides" 
        : `${framework}, ${databaseType}`;
        
      // 1. Create the project
      const project = await api.projects.create(name, description, techStackString);
      
      // 2. Automatically trigger generation pipeline
      await api.projects.generate(project.id);
      
      // 3. Redirect to the execution console!
      router.push(`/dashboard/project/${project.id}/execute`);
    } catch (err: any) {
      setError(err.message || "Failed to create project.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl backdrop-blur-md">
          {/* Back button */}
          <button
            onClick={() => step > 1 ? handleBack() : router.push("/dashboard")}
            className="inline-flex items-center space-x-2 text-sm text-zinc-400 hover:text-zinc-200 mb-8 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{step > 1 ? "Back" : "Cancel"}</span>
          </button>

          {/* Stepper Indicators */}
          <div className="flex items-center justify-between mb-8 max-w-sm mx-auto">
            <div className="flex flex-col items-center">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border ${
                step >= 1 ? "bg-indigo-600 border-indigo-500 text-white" : "border-zinc-800 text-zinc-500 bg-zinc-900"
              }`}>
                1
              </span>
              <span className="text-xs text-zinc-400 mt-2 font-medium">Idea & details</span>
            </div>
            <div className="flex-1 h-px bg-zinc-800 mx-2 -translate-y-3" />
            <div className="flex flex-col items-center">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border ${
                step >= 2 ? "bg-indigo-600 border-indigo-500 text-white" : "border-zinc-800 text-zinc-500 bg-zinc-900"
              }`}>
                2
              </span>
              <span className="text-xs text-zinc-400 mt-2 font-medium">Tech stack</span>
            </div>
            <div className="flex-1 h-px bg-zinc-800 mx-2 -translate-y-3" />
            <div className="flex flex-col items-center">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border ${
                step >= 3 ? "bg-indigo-600 border-indigo-500 text-white" : "border-zinc-800 text-zinc-500 bg-zinc-900"
              }`}>
                3
              </span>
              <span className="text-xs text-zinc-400 mt-2 font-medium">Launch</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3.5 text-sm text-rose-400">
              {error}
            </div>
          )}

          {/* Step 1: Idea and Basic Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Define your software project</h2>
                <p className="text-sm text-zinc-400">Provide a descriptive name and detail your project objectives.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="proj-name" className="block text-sm font-medium text-zinc-300 mb-2">
                    Project Name
                  </label>
                  <input
                    id="proj-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 px-3.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. Finance Budget Tracker, SaaS Dashboard"
                  />
                </div>

                <div>
                  <label htmlFor="proj-desc" className="block text-sm font-medium text-zinc-300 mb-2">
                    Project Description & Features
                  </label>
                  <textarea
                    id="proj-desc"
                    required
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 px-3.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm resize-none"
                    placeholder="Describe what the application should do. List primary features, targets, user capabilities, authentication options, receipt scanner features, or dashboard widgets."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleNext}
                  className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Tech Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Architecture & Tech Stack preferences</h2>
                <p className="text-sm text-zinc-400">Select language bindings or let the Requirement Analyst agent determine the stack.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/20">
                  <input
                    type="checkbox"
                    id="ai-decision"
                    checked={aiDecision}
                    onChange={(e) => setAiDecision(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="ai-decision" className="text-sm font-medium text-zinc-300 select-none cursor-pointer">
                    Let the agent orchestrator decide the optimal stack (Recommended)
                  </label>
                </div>

                {!aiDecision && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Preferred Languages / Frameworks
                      </label>
                      <div className="relative">
                        <Code2 className="absolute top-3 left-3 h-5 w-5 text-zinc-500" />
                        <input
                          type="text"
                          value={framework}
                          onChange={(e) => setFramework(e.target.value)}
                          className="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                          placeholder="Next.js, FastAPI, NestJS, Go"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Preferred Database System
                      </label>
                      <div className="relative">
                        <Database className="absolute top-3 left-3 h-5 w-5 text-zinc-500" />
                        <input
                          type="text"
                          value={databaseType}
                          onChange={(e) => setDatabaseType(e.target.value)}
                          className="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                          placeholder="PostgreSQL, MongoDB, SQLite, Redis"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center space-x-2 rounded-lg bg-zinc-900 border border-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-350 hover:bg-zinc-800 transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                
                <button
                  onClick={handleNext}
                  className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition cursor-pointer"
                >
                  <span>Review & Confirm</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation and Trigger */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Launch Agent SDLC pipeline</h2>
                <p className="text-sm text-zinc-400">Review specifications and deploy the collaborative AI pipeline.</p>
              </div>

              <div className="space-y-4 border border-zinc-800 bg-zinc-900/20 p-5 rounded-xl text-sm">
                <div className="grid grid-cols-3 border-b border-zinc-800/60 pb-3">
                  <span className="text-zinc-500 font-medium">Project Name:</span>
                  <span className="col-span-2 text-zinc-200 font-semibold">{name}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-zinc-800/60 pb-3">
                  <span className="text-zinc-500 font-medium">Idea Pitch:</span>
                  <span className="col-span-2 text-zinc-300 line-clamp-3 leading-relaxed">{description}</span>
                </div>
                <div className="grid grid-cols-3 pb-1">
                  <span className="text-zinc-500 font-medium">Tech Profile:</span>
                  <span className="col-span-2 text-zinc-300 font-mono text-xs">
                    {aiDecision ? "Orchestrator Decision (Requirements RAG driven)" : `${framework} / ${databaseType}`}
                  </span>
                </div>
              </div>

              {/* Informative Step Logs info */}
              <div className="flex items-start space-x-3 text-xs text-indigo-400/80 bg-indigo-950/20 border border-indigo-900/50 p-4 rounded-lg leading-relaxed">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                <span>
                  Launching will deploy <strong>six AI agents</strong> sequentially: Requirement Analyst &rarr; Software Architect &rarr; Frontend Developer &rarr; Backend Developer &rarr; QA Engineer &rarr; Documentation Agent. You will see active logs in real time.
                </span>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="inline-flex items-center space-x-2 rounded-lg bg-zinc-900 border border-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-350 hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Launching agents...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="h-4 w-4 fill-indigo-400 text-indigo-200" />
                      <span>Start Pipeline Run</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
