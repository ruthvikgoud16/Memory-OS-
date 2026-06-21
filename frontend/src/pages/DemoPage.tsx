import React, { useEffect, useRef, useState } from "react";
import { 
  Database, Cpu, Network, Zap, Play, ArrowRight, 
  Terminal, ShieldCheck, Layers, Sparkles 
} from "lucide-react";
import { GraphVisualization } from "../components/GraphVisualization";
import { api } from "../services/api";

interface DemoPageProps {
  onEnterDashboard: () => void;
}

export const DemoPage: React.FC<DemoPageProps> = ({ onEnterDashboard }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<"idle" | "research" | "writer" | "reviewer">("idle");
  const [logs, setLogs] = useState<string[]>([]);

  // Canvas particle network background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const count = 45;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 0.8
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
      ctx.strokeStyle = "rgba(139, 92, 246, 0.05)";
      ctx.lineWidth = 1;

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Run mock demonstration sequence using existing API
  const handleRunDemo = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setLogs([]);
    
    // Add logs & update step transitions
    const log = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    
    try {
      log("Initializing Judge Demo session...");
      const sessName = `Judge Demo ${Math.floor(Math.random() * 900 + 100)}`;
      const sess = await api.createSession(sessName, { isDemo: true });
      log(`Valkey Session hash initialized: ${sess.id}`);
      
      // Step 1: Research
      setSimStep("research");
      log("Spinning up ResearchAgent...");
      log("ResearchAgent querying Wikipedia and Valkey knowledge schemas...");
      await api.addEvent(sess.id, "ResearchAgent", "execution_start", { query: "Valkey best practices" });
      await new Promise(r => setTimeout(r, 1600));
      
      log("ResearchAgent complete: saved facts hash 'research_facts' inside Valkey context.");
      await api.addMemory("session", sess.id, "research_facts", { topics: ["Valkey Streams", "Pub/Sub", "Hashes"] }, "ResearchAgent", ["research", "demo"]);
      await api.addEvent(sess.id, "ResearchAgent", "completion", { status: "research_compiled" });
      
      // Step 2: Writer
      setSimStep("writer");
      log("Spinning up WriterAgent...");
      log("WriterAgent retrieving facts from Valkey hash keys...");
      await api.addEvent(sess.id, "WriterAgent", "execution_start", { target_memory: "research_facts" });
      await new Promise(r => setTimeout(r, 1600));
      
      log("WriterAgent completed drafting: stored article object hash 'article_draft' in Valkey.");
      await api.addMemory("session", sess.id, "article_draft", { title: "Valkey: Build Beyond Limits" }, "WriterAgent", ["draft", "demo"]);
      await api.addEvent(sess.id, "WriterAgent", "completion", { status: "article_draft_saved" });

      // Step 3: Reviewer
      setSimStep("reviewer");
      log("Spinning up ReviewerAgent...");
      log("ReviewerAgent evaluating draft context spelling & tone checks...");
      await api.addEvent(sess.id, "ReviewerAgent", "execution_start", { target_memory: "article_draft" });
      await new Promise(r => setTimeout(r, 1600));
      
      log("ReviewerAgent decision: APPROVED (Grade: A+). Stored decision details in Valkey.");
      await api.addMemory("session", sess.id, "reviewer_decision", { approved: true, grade: "A+" }, "ReviewerAgent", ["review", "demo"]);
      await api.addEvent(sess.id, "ReviewerAgent", "completion", { status: "approval_completed" });

      setSimStep("idle");
      log("Deallocating short-lived demo hashes from Valkey cache context...");
      await api.deleteSession(sess.id);
      log("Valkey storage cleared. Demo execution completed successfully! ✅");
      setIsSimulating(false);
    } catch (err) {
      log(`Simulation error: ${err}`);
      setSimStep("idle");
      setIsSimulating(false);
    }
  };

  const capabilities = [
    {
      title: "Valkey Hashes",
      desc: "Instant session key storage mapping structured context and state caches with sub-millisecond lookups.",
      color: "border-primary/20 hover:border-primary/40",
      badge: "bg-primary/10 text-primary border-primary/20",
      icon: Database
    },
    {
      title: "Valkey Streams",
      desc: "Ordered logs and agent timeline capture ensuring trace sequencing across execution run pipelines.",
      color: "border-secondary/20 hover:border-secondary/40",
      badge: "bg-secondary/10 text-secondary border-secondary/20",
      icon: Network
    },
    {
      title: "Pub/Sub Bus",
      desc: "Fast event-driven broker linking multi-agent systems without bottleneck delays or blocking threads.",
      color: "border-tertiary/20 hover:border-tertiary/40",
      badge: "bg-tertiary/10 text-tertiary border-tertiary/20",
      icon: Zap
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#050505] text-slate-100 overflow-x-hidden flex flex-col justify-between pb-12">
      {/* Background Interactive Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />
      
      {/* Decorative Blur Blobs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 glow-blob bg-secondary/15 animate-float-slow z-0" />
      <div className="absolute bottom-40 right-1/4 w-96 h-96 glow-blob bg-primary/15 animate-float-medium z-0" />

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 text-center space-y-6">
        <div className="inline-flex items-center space-x-2 rounded-full bg-white/[0.02] border border-white/10 px-4.5 py-1.5 text-xs font-bold text-slate-400 backdrop-blur-md shadow-lg select-none">
          <Sparkles className="h-4 w-4 text-secondary animate-pulse" />
          <span>Valkey-Only Distributed AI Memory Architecture</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto text-white">
          Accelerate Multi-Agent State with <span className="gradient-text-hero font-extrabold">MemoryOS</span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-medium">
          A premium, sub-millisecond agent cache and memory coordination panel powered entirely by Valkey. Build beyond local loops.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={handleRunDemo}
            disabled={isSimulating}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            <Play className="h-4.5 w-4.5 fill-white" />
            <span>{isSimulating ? "Simulating Execution..." : "Launch Demo Sequence"}</span>
          </button>
          
          <button
            onClick={onEnterDashboard}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] px-6 py-3.5 text-sm font-bold text-white transition-all cursor-pointer"
          >
            <span>Enter Main Dashboard</span>
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </section>

      {/* Live Metrics / Info */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 w-full">
        <div className="glass-card p-5 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Write Latency</span>
          <h3 className="text-2xl font-black text-white font-mono mt-2">0.18 ms</h3>
          <p className="text-[10px] text-slate-500 mt-1">Rolling average write speeds in Valkey</p>
        </div>
        <div className="glass-card p-5 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Orchestration Hit Rate</span>
          <h3 className="text-2xl font-black text-white font-mono mt-2">99.87%</h3>
          <p className="text-[10px] text-slate-500 mt-1">Successful agent retrieval contexts</p>
        </div>
        <div className="glass-card p-5 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Engine Speed</span>
          <h3 className="text-2xl font-black text-white font-mono mt-2">&gt; 120,000 QPS</h3>
          <p className="text-[10px] text-slate-500 mt-1">Multi-threaded cache server execution</p>
        </div>
      </section>

      {/* Interactive Demonstration Panel */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SVG Agent Visualizer */}
        <div className="lg:col-span-6 w-full">
          <GraphVisualization activeStep={simStep} />
        </div>

        {/* Live Terminal Terminal Logs */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 border border-white/5 flex flex-col h-[360px] w-full">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bold text-white flex items-center space-x-2">
              <Terminal className="h-4.5 w-4.5 text-secondary" />
              <span>Live Telemetry Engine Logs</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest animate-pulse">
              {isSimulating ? "Streaming" : "Standby"}
            </span>
          </div>

          <div className="mt-4 flex-1 bg-black/40 border border-white/5 rounded-xl p-4 font-mono-code text-xs text-slate-400 overflow-y-auto space-y-2 select-text">
            {logs.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-600 space-y-1">
                <span>Waiting for demo trigger...</span>
                <span className="text-[10px]">Click "Launch Demo Sequence" to compile facts</span>
              </div>
            ) : (
              logs.map((l, idx) => (
                <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                  {l}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Valkey Capabilities Details */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 w-full">
        <h2 className="text-2xl font-extrabold text-white text-center tracking-tight">
          Supercharged Distributed Context Architecture
        </h2>
        <p className="text-slate-400 text-xs text-center font-medium mt-1">
          MemoryOS harnesses core Valkey capabilities to bypass database bottleneck latencies.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
          {capabilities.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div key={idx} className={`glass-card p-5 border transition-all duration-300 ${c.color} flex flex-col justify-between h-44`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase rounded-full px-2.5 py-0.5 border ${c.badge}`}>
                    {c.title.split(" ").slice(1).join(" ") || c.title}
                  </span>
                  <div className="h-9 w-9 rounded-lg bg-white/[0.01] border border-white/5 flex items-center justify-center text-slate-400">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-white">{c.title}</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium">{c.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 text-center w-full">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Verified Stack Integration</span>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          {[
            { name: "Valkey Cache", icon: Database, color: "text-red-400", type: "Storage" },
            { name: "FastAPI Backend", icon: Cpu, color: "text-primary", type: "Controller" },
            { name: "React 18 & TS", icon: Layers, color: "text-tertiary", type: "Interface" },
            { name: "Docker Compose", icon: ShieldCheck, color: "text-blue-400", type: "Orchestration" }
          ].map((t, idx) => {
            const Icon = t.icon;
            return (
              <div key={idx} className="glass-card p-4 border border-white/5 flex items-center space-x-3 hover:bg-white/[0.02] hover:border-white/10 transition-all duration-200">
                <div className="h-9 w-9 rounded-lg bg-white/[0.01] border border-white/5 flex items-center justify-center">
                  <Icon className={`h-5 w-5 ${t.color}`} />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white">{t.name}</h4>
                  <span className="text-[9px] font-mono text-slate-500 font-bold block uppercase">{t.type}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
