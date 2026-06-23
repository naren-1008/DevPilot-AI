"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { MessageSquare, Send, Loader2, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id?: number;
  sender: "user" | "assistant";
  message: string;
  created_at?: string;
}

export function ChatBox({ projectId }: { projectId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChatHistory = async () => {
    try {
      const history = await api.projects.getChatHistory(projectId);
      setMessages(history);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [projectId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userQuery = query.trim();
    setQuery("");
    
    // Add user message locally first
    setMessages((prev) => [...prev, { sender: "user", message: userQuery }]);
    setLoading(true);

    try {
      const response = await api.projects.askAssistant(projectId, userQuery);
      setMessages((prev) => [...prev, { sender: "assistant", message: response.answer }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", message: `Error: ${err.message || "Failed to search specifications."}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat window bubble */}
      {isOpen && (
        <div className="w-[380px] h-[500px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-indigo-650 p-4 border-b border-indigo-900 flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 fill-white/20" />
              <div>
                <h3 className="font-bold text-sm">Specification QA Assistant</h3>
                <p className="text-[10px] text-indigo-200">Semantic project search (RAG)</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white text-xs cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                <Bot className="h-10 w-10 mx-auto text-zinc-650 mb-3" />
                <p className="text-xs">Ask questions about the generated requirements, component hierarchies, or database APIs.</p>
                <p className="text-[10px] text-zinc-600 mt-1">Example: &quot;Show me the tables in the database schema&quot;</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "assistant" && (
                    <div className="h-7 w-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div className={`p-3 rounded-xl text-sm leading-relaxed max-w-[80%] ${
                    msg.sender === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-zinc-800/60 text-zinc-300 rounded-tl-none border border-zinc-800"
                  }`}>
                    {msg.message}
                  </div>
                  {msg.sender === "user" && (
                    <div className="h-7 w-7 rounded-lg bg-indigo-900 border border-indigo-850 flex items-center justify-center text-indigo-300 flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className="h-7 w-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-850 rounded-tl-none text-zinc-500 text-xs flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  <span>Searching and reasoning...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-950 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about project specs..."
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 py-2 px-3 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none text-xs"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 text-white disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Launcher Button bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-650 hover:bg-indigo-550 text-white shadow-2xl transition cursor-pointer hover:scale-105 duration-200"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </div>
  );
}
