"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Terminal, Cpu, ArrowRight, Shield, Zap, Code, HelpCircle, Layers } from "lucide-react";

export default function Home() {
  const steps = [
    { name: "Requirement Analyst", desc: "Transforms high-level ideas into SRS specs, user stories, and functional/non-functional lists." },
    { name: "Software Architect", desc: "Selects tech stacks, plans data models, documents API tables, and outlines Mermaid UML." },
    { name: "Frontend Developer", desc: "Drafts client layouts, specifies component trees, and creates React skeleton files." },
    { name: "Backend Developer", desc: "Configures database tables, defines REST endpoints, and builds FastAPI routing code." },
    { name: "QA Engineer", desc: "Generates Pytest/Jest cases, reviews edge-case scenarios, and verifies API parameters." },
    { name: "Documentation Agent", desc: "Assembles user READMEs, installation logs, API endpoints manual, and cloud setups." },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32 flex flex-col items-center justify-center text-center px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-950/50 border border-indigo-900/50 px-3 py-1 text-sm text-indigo-400 mb-6">
            <Cpu className="h-4 w-4" />
            <span>Powered by LangGraph & Gemini 1.5/2.5</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            Autonomous Software Development <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Orchestrated by Multi-Agents
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Submit your project idea. Watch cooperative specialized AI agents collaborate across functional roles to generate fully documented, structured code skeletons.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#agent-sdlc"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 px-6 py-3.5 text-base font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Agents Workflow Grid */}
      <section id="agent-sdlc" className="py-20 border-t border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Cooperative Agent SDLC Pipeline
            </h2>
            <p className="mt-4 text-zinc-400">
              DevPilot AI uses a linear LangGraph graph to coordinate six specialized roles.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div
                key={step.name}
                className="glow-border relative flex flex-col p-6 rounded-xl border border-zinc-900 bg-zinc-900/40 backdrop-blur"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-950 text-indigo-400 font-bold border border-indigo-900">
                    {idx + 1}
                  </span>
                  <Layers className="h-5 w-5 text-zinc-600" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.name}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits / Tech Stack Summary */}
      <section className="py-20 border-t border-zinc-900 bg-zinc-900/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="flex flex-col space-y-3">
              <Zap className="h-8 w-8 text-indigo-500" />
              <h3 className="text-xl font-bold text-white">Hyper-Fast Generation</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Translate requirements into architecture models, API skeletons, and documentation templates in minutes, not days.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <Code className="h-8 w-8 text-purple-500" />
              <h3 className="text-xl font-bold text-white">Full-Stack Code skeletons</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Generates modular React component structures and FastAPI route modules, packaged and ready for code extraction in a ZIP file.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <HelpCircle className="h-8 w-8 text-pink-500" />
              <h3 className="text-xl font-bold text-white">AI-Powered Q&A (RAG)</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Interact with the generated specifications using natural language to query and chat with your project's vector store index.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 py-8 bg-zinc-950 text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} DevPilot AI. All rights reserved. Built for autonomous development workflows.
      </footer>
    </div>
  );
}
