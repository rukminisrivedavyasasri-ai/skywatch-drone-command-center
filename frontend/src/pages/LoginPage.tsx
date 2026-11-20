import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Radio, Lock, User, AlertCircle, ArrowRight, Check } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/common/Button";

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin@SkyWatch2026");
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate("/");
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 bg-[#0B1220] overflow-hidden">
      {/* Tactical Radar Animation Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="relative w-[700px] h-[700px] rounded-full border border-cyan-500/20">
          <div className="absolute inset-16 rounded-full border border-cyan-500/15" />
          <div className="absolute inset-32 rounded-full border border-cyan-500/10" />
          <div className="absolute inset-48 rounded-full border border-cyan-500/10" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-500/20" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-500/20" />
          {/* Rotating radar sweep */}
          <div className="absolute inset-0 rounded-full animate-radar-sweep bg-gradient-to-tr from-cyan-500/20 via-transparent to-transparent" />
        </div>
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(rgba(34, 211, 238, 0.4) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-white/10 shadow-2xl p-8 z-10 space-y-6">
        {/* Brand & Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/20 mb-2">
            <Radio className="w-8 h-8 text-slate-950 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-white">SKYWATCH</h1>
          <p className="text-xs text-cyan-400 font-mono tracking-wider uppercase">
            Drone Surveillance Command Center
          </p>
          <p className="text-xs text-slate-400 font-sans">
            CipherCop Hackathon 2026 &bull; Defence & Security Division
          </p>
        </div>

        {/* Judges Demo Credentials Callout Box */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-cyan-300 font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" /> Demo Credentials (Judges)
            </span>
            <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300">
              1-CLICK AUTOFILL
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => fillCredentials("admin", "Admin@SkyWatch2026")}
              className={`p-2 rounded-xl border text-left transition-all ${
                username === "admin"
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                  : "bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>ADMIN ROLE</span>
                {username === "admin" && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">admin / Admin@SkyWatch2026</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials("operator", "Operator@SkyWatch2026")}
              className={`p-2 rounded-xl border text-left transition-all ${
                username === "operator"
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                  : "bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>OPERATOR ROLE</span>
                {username === "operator" && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">operator / Operator@SkyWatch2026</div>
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider font-mono">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter operator callsign"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider font-mono">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter security passphrase"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors font-mono"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={isLoading}
            className="w-full mt-2"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Authenticate & Access HQ
          </Button>
        </form>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 font-mono border-t border-white/5 pt-4">
          End-to-End Encrypted Session &bull; Offline Operational
        </div>
      </div>
    </div>
  );
};
