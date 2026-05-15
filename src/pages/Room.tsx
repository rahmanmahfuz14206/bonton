import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus,
  File, 
  Download, 
  Upload, 
  Users, 
  QrCode, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Link as LinkIcon,
  ChevronLeft,
  Loader2,
  Share2,
  Shield
} from "lucide-react";
import toast from "react-hot-toast";

interface RelayFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
  timestamp: number;
}

export default function Room() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isHost = searchParams.get("role") === "host";
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [files, setFiles] = useState<RelayFile[]>([]);
  const [isHostActive, setIsHostActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [connected, setConnected] = useState(false);

  // Join link for students (Global common link)
  const joinUrl = window.location.origin;

  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on("connect", () => {
      setConnected(true);
      s.emit("join-room", { isHost });
    });

    s.on("host-status", ({ active }: { active: boolean }) => {
      setIsHostActive(active);
      if (!active && !isHost) {
        toast.error("Host has ended the session.", { id: "host-status" });
      } else if (active && !isHost) {
        toast.success("Connected with the Host", { id: "host-status" });
      }
    });

    s.on("file-received", (file: RelayFile) => {
      setFiles((prev) => [file, ...prev]);
      if (!isHost) {
        toast.success(`New file received: ${file.name}`);
      }
    });

    s.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      s.disconnect();
    };
  }, [isHost]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    if (!isHost) return;
    
    let fileList: FileList | null = null;
    if ("files" in e) {
      fileList = (e as React.DragEvent).dataTransfer?.files || null;
    } else if (e.target instanceof HTMLInputElement) {
      fileList = e.target.files;
    }

    if (!fileList || fileList.length === 0) return;

    for (const f of Array.from(fileList)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        const relayFile: RelayFile = {
          id: Math.random().toString(36).substring(7),
          name: f.name,
          type: f.type,
          size: f.size,
          data: buffer,
          timestamp: Date.now(),
        };

        // Emit to server
        socket?.emit("file-relay", { file: relayFile });
        
        // Add to local list for visual feedback
        setFiles((prev) => [relayFile, ...prev]);
        toast.success(`Sent: ${f.name}`);
      };
      reader.readAsArrayBuffer(f);
    }
  };

  const downloadFile = (file: RelayFile) => {
    const blob = new Blob([file.data], { type: file.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    toast.success("Link copied to clipboard!");
  };

  if (!connected) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">Connecting to LAN Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl p-4 md:p-8">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-xl md:rounded-2xl bg-blue-500 text-white shadow-md border-2 border-slate-900"
          >
            <Share2 className="h-5 w-5 md:h-8 md:w-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Bonton
            </h1>
            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              a group file sharing system..
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex items-center gap-2 rounded-full border-2 md:border-4 border-slate-900 bg-white px-3 md:px-5 py-1.5 md:py-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] md:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <span className={`h-2 w-2 md:h-3 md:w-3 rounded-full ${isHostActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-700">
              {isHostActive ? "Live" : "Waiting"}
            </span>
          </div>
          
          {isHost && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl md:rounded-2xl border-2 md:border-4 border-slate-900 bg-blue-500 font-black text-white shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] md:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all hover:bg-blue-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              title="Broadcast File"
            >
              <Plus className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          )}

          <button
            onClick={() => setShowQR(true)}
            className="flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl md:rounded-2xl border-2 md:border-4 border-slate-900 bg-yellow-400 font-black text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] md:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all hover:bg-yellow-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Share Room"
          >
            <QrCode className="h-4 w-4 md:h-5 md:w-5" />
          </button>

          {!isHost && (
            <button
              onClick={() => navigate("/?role=host")}
              className="rounded-xl md:rounded-2xl border-2 md:border-4 border-slate-900 bg-white px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-black uppercase text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] md:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all hover:bg-slate-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              Host
            </button>
          )}

          {isHost && (
             <button
                onClick={() => navigate("/")}
                className="rounded-xl md:rounded-2xl border-2 md:border-4 border-slate-900 bg-red-500 px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] md:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all hover:bg-red-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                End
              </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl">
        <div className="flex h-full flex-col rounded-3xl md:rounded-[32px] border-2 md:border-4 border-slate-900 bg-white p-4 md:p-8 shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] md:shadow-[12px_12px_0px_0px_rgba(59,130,246,1)]">
          <div className="mb-6 flex items-center justify-between border-b-2 md:border-b-4 border-slate-50 pb-4 md:pb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight text-slate-900">Shared Files</h2>
              {!isHostActive && !isHost && (
                <span className="animate-pulse rounded-lg bg-red-100 px-1.5 py-0.5 text-[8px] font-black uppercase text-red-600">Offline</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-10 md:h-6 md:w-12 items-center justify-center rounded-lg border md:border-2 border-slate-900 bg-yellow-400 text-[10px] font-black uppercase leading-none">
                {files.length}
              </span>
              <span className="hidden sm:inline text-xs font-black uppercase tracking-widest text-slate-400">Items</span>
            </div>
          </div>

          <div className="min-h-[300px] md:min-h-[400px] space-y-3 md:space-y-4">
            <AnimatePresence initial={false}>
              {files.map((file, idx) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`group relative flex items-center gap-3 md:gap-4 rounded-xl md:rounded-2xl border-2 md:border-4 border-slate-900 p-3 md:p-4 transition-all active:scale-[0.98] ${
                    idx === 0 ? "bg-blue-50 border-blue-400" : "bg-white"
                  }`}
                >
                  {idx === 0 && (
                      <div className="absolute -top-2 md:-top-3 -right-2 md:-right-3 bg-yellow-400 px-1.5 md:px-2 py-0.5 rounded border md:border-2 border-slate-900 text-[8px] md:text-[10px] font-black uppercase z-10">New!</div>
                  )}
                  <div className="flex h-10 w-10 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-lg md:rounded-xl bg-slate-900 text-white shadow-sm">
                      <span className="text-[8px] md:text-[10px] font-black uppercase">{file.type.split('/')[1]?.substring(0, 4) || 'FILE'}</span>
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <h3 className="truncate text-xs md:text-sm font-black text-slate-800 leading-tight">{file.name}</h3>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {formatSize(file.size)} • {new Date(file.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadFile(file)}
                    className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl bg-blue-500 text-white shadow-md border md:border-2 border-slate-900 hover:bg-blue-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <Download className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {files.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl md:rounded-[32px] border-2 md:border-4 border-dashed border-slate-100 py-20 md:py-32 text-center">
                <div className="mb-4 h-16 w-16 md:h-24 md:w-24 flex items-center justify-center rounded-full bg-slate-50 text-slate-200">
                  <File className="h-8 w-8 md:h-12 md:w-12" />
                </div>
                <p className="text-sm md:text-xl font-black uppercase tracking-tight text-slate-300">Quiet Classroom</p>
                <p className="mt-1 text-[10px] md:text-[12px] font-bold text-slate-300 italic">Broadcasts will show here</p>
              </div>
            )}
          </div>

          <footer className="mt-8 pt-6 border-t md:border-t-2 border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><Shield className="h-2.5 w-2.5 md:h-3 md:w-3" /> NO STORAGE</span>
              <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5 md:h-3 md:w-3" /> LAN ONLY</span>
            </div>
            <p className="flex items-center gap-1">
              © Creation of <a href="https://www.facebook.com/mahfuz14206" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Mah Fuz</a>
            </p>
          </footer>
        </div>
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-xl rounded-3xl md:rounded-[3rem] border-4 md:border-8 border-slate-900 bg-white p-6 md:p-10 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowUploadModal(false)}
                className="absolute top-4 right-4 md:top-8 md:right-8 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-xl border-2 md:border-4 border-slate-900 bg-red-500 text-white hover:bg-red-600 transition-all active:scale-90"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              
              <div className="text-center">
                <h2 className="mb-1 text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Broadcast</h2>
                <p className="mb-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Instant Teacher-to-Student Feed</p>
                
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e as any); setShowUploadModal(false); }}
                  className={`group relative flex flex-col items-center justify-center rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-dashed py-12 md:py-16 transition-all ${
                    isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="mb-4 rounded-full bg-white p-4 md:p-6 text-blue-500 shadow-md border-2 border-slate-900 transition-transform group-hover:scale-110">
                    <Upload className="h-8 w-8 md:h-10 md:w-10" />
                  </div>
                  <h3 className="mb-1 text-lg md:text-xl font-black text-slate-900 uppercase">Select files</h3>
                  <p className="text-[10px] md:text-sm font-bold text-slate-400">Drag items or browse device</p>
                  
                  <label className="mt-6 md:mt-8 cursor-pointer rounded-xl md:rounded-2xl border-2 md:border-4 border-slate-900 bg-blue-500 px-6 md:px-10 py-2.5 md:py-3 text-xs md:text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] md:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                    Choose Files
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => { handleFileUpload(e); setShowUploadModal(false); }} 
                    />
                  </label>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-[2rem] md:rounded-[3rem] border-4 md:border-8 border-slate-900 bg-white p-6 md:p-10 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 md:top-8 md:right-8 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-xl border-2 md:border-4 border-slate-900 bg-red-500 text-white hover:bg-red-600 transition-all active:scale-90"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              
              <div className="text-center">
                <h2 className="mb-1 text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Share</h2>
                <p className="mb-6 md:mb-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Students join here</p>
                
                <div className="mx-auto mb-6 md:mb-10 flex justify-center rounded-2xl md:rounded-3xl border-2 md:border-4 border-slate-900 bg-white p-4 md:p-8 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] md:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                  <QRCodeSVG value={joinUrl} size={150} level="H" className="md:w-[200px] md:h-[200px]" />
                </div>

                <div className="rounded-xl md:rounded-2xl border-2 md:border-4 border-slate-900 bg-indigo-50 p-4 mb-2 text-left">
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Direct URL</p>
                  <p className="truncate text-xs md:text-sm font-black text-indigo-900">{joinUrl}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
