import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Share2, Users, FileUp, Shield } from "lucide-react";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleStart = () => {
    navigate(`/session?role=host`);
  };

  const handleJoin = () => {
    navigate(`/session`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md rounded-[32px] border-4 border-slate-900 bg-white p-8 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]"
      >
        <div className="mb-6 flex justify-center">
          <div className="overflow-hidden rounded-2xl bg-white p-1 shadow-md border-2 border-slate-900">
            <img src="/logo.png" alt="Bonton Logo" className="h-16 w-16 md:h-20 md:w-20 object-contain" />
          </div>
        </div>
        
        <h1 className="mb-2 text-5xl font-brand text-slate-900 md:text-7xl text-center">
          Bonton
        </h1>
        <p className="mb-8 text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
          LAN File Share
        </p>

        <div className="space-y-4">
          <button
            onClick={handleStart}
            className="group w-full rounded-2xl bg-blue-500 py-4 text-lg font-black uppercase text-white shadow-md border-4 border-slate-900 transition-all hover:bg-blue-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
          >
            Start Hosting
          </button>
          
          <button
            onClick={handleJoin}
            className="group w-full rounded-2xl bg-white py-4 text-lg font-black uppercase text-slate-900 shadow-md border-4 border-slate-900 transition-all hover:bg-slate-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
          >
            Join as User
          </button>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border-2 border-slate-900 text-indigo-600 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <Shield className="h-6 w-6" />
            </div>
            <span>No Storage</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 border-2 border-slate-900 text-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <Users className="h-6 w-6" />
            </div>
            <span>LAN Based</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-400 border-2 border-slate-900 text-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <FileUp className="h-6 w-6" />
            </div>
            <span>Real-time</span>
          </div>
        </div>
      </motion.div>

      <footer className="mt-12 text-center">
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.1em]">
          Powered by <span className="text-slate-900">WebSockets</span> • Zero Cloud Storage
        </p>
      </footer>
    </div>
  );
}
