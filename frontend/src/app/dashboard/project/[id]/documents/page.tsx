"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatBox } from "@/components/chat/chat-box";
import { api } from "@/lib/api";
import { 
  Download, 
  FileCode, 
  FolderOpen, 
  Cpu, 
  Layers, 
  CheckCircle,
  Loader2,
  Code2,
  FileText,
  ChevronRight,
  Database,
  Terminal as TermIcon
} from "lucide-react";
import mermaid from "mermaid";

interface Artifact {
  id: number;
  project_id: number;
  agent_type: string;
  title: string;
  content: any; // Dict object after parsing
  created_at: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
}

// Simple Markdown parser
function parseMarkdown(md: string) {
  if (!md) return "";
  let html = md;

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-indigo-400 mt-4 mb-2">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-white mt-5 mb-2.5">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-bold text-white mt-6 mb-3 border-b border-zinc-800 pb-2">$1</h2>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-150 font-semibold">$1</strong>');
  
  // Bullet points
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="list-disc list-inside text-zinc-350 ml-4 mb-1.5">$1</li>');
  html = html.replace(/^\s*\*\s+(.*$)/gim, '<li class="list-disc list-inside text-zinc-350 ml-4 mb-1.5">$1</li>');
  
  // Code Blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (_, lang, code) => {
    return `<pre class="bg-black border border-zinc-850 p-4 rounded-xl overflow-x-auto my-4 text-xs font-mono text-zinc-300"><code>${code}</code></pre>`;
  });

  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code class="bg-zinc-900 border border-zinc-850 rounded px-1.5 py-0.5 text-xs text-indigo-450 font-mono">$1</code>');
  
  // Paragraphs
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(p => {
    const trimmed = p.trim();
    if (trimmed.startsWith("<h") || trimmed.startsWith("<li") || trimmed.startsWith("<pre") || trimmed.startsWith("<table") || trimmed.startsWith("<div")) {
      return p;
    }
    return `<p class="text-sm text-zinc-400 leading-relaxed mb-3">${p.replace(/\n/g, "<br />")}</p>`;
  }).join("\n");
  
  return html;
}

// Mermaid diagram renderer
function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "monospace"
    });
  }, []);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute("data-processed");
      ref.current.innerHTML = chart;
      try {
        mermaid.contentLoaded();
        setError(false);
      } catch (err) {
        console.error("Mermaid error:", err);
        setError(true);
      }
    }
  }, [chart]);

  if (error) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl font-mono text-xs text-rose-400">
        Failed to render Mermaid chart correctly. Raw code:
        <pre className="mt-2 text-zinc-400 whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 overflow-x-auto flex justify-center">
      <div ref={ref} className="mermaid w-full flex justify-center text-center">
        {chart}
      </div>
    </div>
  );
}

export default function ProjectDocuments() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [project, setProject] = useState<Project | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tabs states
  const [activeAgentTab, setActiveAgentTab] = useState<string>("requirement");
  const [activeSubTab, setActiveSubTab] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string>("");

  const loadData = async () => {
    if (!id) return;
    try {
      const projData = await api.projects.get(parseInt(id));
      setProject(projData);
      
      const artData = await api.projects.getArtifacts(parseInt(id));
      setArtifacts(artData);
      
      // Default subtab settings
      if (artData.length > 0) {
        const reqArt = artData.find(a => a.agent_type === "requirement");
        if (reqArt && reqArt.content) {
          setActiveSubTab(Object.keys(reqArt.content)[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load generated specifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Update subtab default when agent tab changes
  useEffect(() => {
    const activeArt = artifacts.find(a => a.agent_type === activeAgentTab);
    if (activeArt && activeArt.content) {
      const keys = Object.keys(activeArt.content);
      if (keys.length > 0) {
        setActiveSubTab(keys[0]);
        
        // Reset file browser selector if switching tabs
        if (keys[0] === "react_component_skeletons" || keys[0] === "fastapi_route_skeletons") {
          const files = Object.keys(activeArt.content[keys[0]] || {});
          if (files.length > 0) {
            setSelectedFile(files[0]);
          } else {
            setSelectedFile("");
          }
        }
      }
    } else {
      setActiveSubTab("");
    }
  }, [activeAgentTab, artifacts]);

  // Sync selected file when subtab changes to code trees
  useEffect(() => {
    const activeArt = artifacts.find(a => a.agent_type === activeAgentTab);
    if (activeArt && activeArt.content && activeSubTab) {
      if (activeSubTab === "react_component_skeletons" || activeSubTab === "fastapi_route_skeletons") {
        const files = Object.keys(activeArt.content[activeSubTab] || {});
        if (files.length > 0 && !files.includes(selectedFile)) {
          setSelectedFile(files[0]);
        }
      }
    }
  }, [activeSubTab, activeAgentTab, artifacts, selectedFile]);

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
          <button onClick={() => router.push("/dashboard")} className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:text-white">Go to Projects</button>
        </div>
      </div>
    );
  }

  const agentTabs = [
    { type: "requirement", label: "Requirements Analyst" },
    { type: "architect", label: "Software Architect" },
    { type: "frontend", label: "Frontend Developer" },
    { type: "backend", label: "Backend Developer" },
    { type: "qa", label: "QA Engineer" },
    { type: "doc", label: "Technical Writer" },
  ];

  const currentArtifact = artifacts.find(a => a.agent_type === activeAgentTab);
  const subTabKeys = currentArtifact && currentArtifact.content ? Object.keys(currentArtifact.content) : [];

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

          {/* Top Info Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">{project.name} Specifications</h1>
              <p className="text-sm text-zinc-400 mt-1">Review agent outputs, database schemas, and skeletons.</p>
            </div>
            
            {artifacts.length > 0 && (
              <a
                href={api.projects.getExportUrl(project.id)}
                download
                className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow cursor-pointer"
              >
                <Download className="h-4.5 w-4.5" />
                <span>Export Code & Docs</span>
              </a>
            )}
          </div>

          {/* Stepper Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3 mb-6">
            {agentTabs.map((tab) => {
              const hasGenerated = artifacts.some(a => a.agent_type === tab.type);
              const isActive = activeAgentTab === tab.type;
              
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveAgentTab(tab.type)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
                    isActive 
                      ? "bg-indigo-600 text-white" 
                      : hasGenerated
                      ? "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850"
                      : "bg-zinc-950 border border-zinc-900 text-zinc-650 cursor-not-allowed"
                  }`}
                  disabled={!hasGenerated}
                >
                  {hasGenerated && <CheckCircle className={`h-4 w-4 ${isActive ? "text-white" : "text-emerald-500"}`} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main workspace */}
          {currentArtifact ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Left Subtabs Selector List */}
              <div className="lg:col-span-1 space-y-1.5">
                <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Specifications</span>
                {subTabKeys.map((key) => {
                  const isActive = activeSubTab === key;
                  const cleanLabel = key.replace(/_/g, " ").replace(/\bsrs\b/g, "SRS");
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveSubTab(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold capitalize transition flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "bg-zinc-800 text-indigo-400 border border-zinc-700"
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                      }`}
                    >
                      <span className="line-clamp-1">{cleanLabel}</span>
                      <ChevronRight className={`h-3 w-3 transition ${isActive ? "rotate-90 text-indigo-400" : "text-zinc-600"}`} />
                    </button>
                  );
                })}
              </div>

              {/* Right Output details panel */}
              <div className="lg:col-span-3 min-h-[450px]">
                <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl h-full">
                  {/* File Explorer layout for skeletons */}
                  {(activeSubTab === "react_component_skeletons" || activeSubTab === "fastapi_route_skeletons") ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[400px]">
                      {/* Sub file explorer list */}
                      <div className="md:col-span-1 border-r border-zinc-800/80 pr-4 space-y-1 overflow-y-auto max-h-[400px]">
                        <span className="block text-[9px] font-bold text-zinc-550 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <FolderOpen className="h-3 w-3 text-indigo-450" />
                          <span>Code tree</span>
                        </span>
                        {Object.keys(currentArtifact.content[activeSubTab] || {}).map((filePath) => {
                          const isSel = selectedFile === filePath;
                          return (
                            <button
                              key={filePath}
                              onClick={() => setSelectedFile(filePath)}
                              className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-mono line-clamp-1 cursor-pointer transition ${
                                isSel 
                                  ? "bg-indigo-950/40 text-indigo-400 font-semibold" 
                                  : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
                              }`}
                            >
                              {filePath.split("/").pop()}
                              <span className="block text-[9px] text-zinc-550 truncate font-sans font-normal mt-0.5">{filePath}</span>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Code reader display */}
                      <div className="md:col-span-2 flex flex-col h-full overflow-y-auto max-h-[400px]">
                        {selectedFile ? (
                          <>
                            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-3">
                              <span className="text-[10px] font-mono text-zinc-500 truncate">{selectedFile}</span>
                              <FileCode className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                            </div>
                            <pre className="flex-1 bg-black p-4 rounded-xl text-xs font-mono overflow-x-auto text-emerald-450 whitespace-pre leading-relaxed">
                              <code>{currentArtifact.content[activeSubTab][selectedFile]}</code>
                            </pre>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-650">
                            <Code2 className="h-8 w-8 text-zinc-800 mb-2" />
                            <p className="text-xs">No code skeleton files generated.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : activeSubTab === "uml_diagrams" ? (
                    <div>
                      <h3 className="text-base font-bold text-white mb-4">Architecture UML Class / Flowchart</h3>
                      {currentArtifact.content[activeSubTab] ? (
                        <MermaidDiagram chart={currentArtifact.content[activeSubTab]} />
                      ) : (
                        <p className="text-xs text-zinc-500">No diagram generated.</p>
                      )}
                    </div>
                  ) : (
                    /* Default Markdown document render */
                    <div 
                      className="prose prose-invert max-w-none prose-sm overflow-y-auto max-h-[500px]"
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(
                          typeof currentArtifact.content[activeSubTab] === "string"
                            ? currentArtifact.content[activeSubTab]
                            : JSON.stringify(currentArtifact.content[activeSubTab], null, 2)
                        )
                      }}
                    />
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-16 border border-zinc-800 rounded-2xl bg-zinc-900/10">
              <Cpu className="h-10 w-10 text-zinc-700 animate-pulse mb-3" />
              <p className="text-sm text-zinc-400">Specifications are being generated. Trigger the pipeline or monitor log console.</p>
              <button 
                onClick={() => router.push(`/dashboard/project/${project.id}/execute`)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:text-white"
              >
                Go to Execution Console
              </button>
            </div>
          )}

          {/* RAG search Q&A Chat widget */}
          <ChatBox projectId={project.id} />
        </main>
      </div>
    </div>
  );
}
