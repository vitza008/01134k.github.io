"use client";

import { useState, useEffect } from "react";

interface UrlRecord {
  id?: number;
  original_url: string;
  short_code: string;
  title: string;
  clicks: number;
  created_at: string;
}

export default function Home() {
  const [longUrl, setLongUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<UrlRecord | null>(null);
  const [urls, setUrls] = useState<UrlRecord[]>([]);
  const [apiStatus, setApiStatus] = useState<{ online: boolean; supabase: boolean }>({
    online: false,
    supabase: false,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get API Base URL from env or fallback to localhost
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Check API health and configuration status
  const checkApiHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/`);
      if (res.ok) {
        const data = await res.json();
        setApiStatus({
          online: true,
          supabase: data.supabase_configured === true,
        });
      } else {
        setApiStatus({ online: false, supabase: false });
      }
    } catch (e) {
      setApiStatus({ online: false, supabase: false });
    }
  };

  // Fetch list of shortened URLs
  const fetchUrls = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/urls`);
      if (res.ok) {
        const data = await res.json();
        setUrls(data);
      }
    } catch (e) {
      console.error("Failed to fetch URLs:", e);
    }
  };

  useEffect(() => {
    checkApiHealth();
    fetchUrls();
    // Poll for updates every 10 seconds to keep analytics fresh
    const interval = setInterval(() => {
      fetchUrls();
      checkApiHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setLoading(true);
    setError("");
    setSuccessData(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: longUrl }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Something went wrong");
      }

      const data = await res.json();
      setSuccessData(data);
      setLongUrl("");
      fetchUrls(); // Refresh the list
    } catch (err: any) {
      setError(err.message || "Cannot connect to the backend server. Please verify .env settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    const fullShortUrl = `${API_BASE_URL}/${code}`;
    navigator.clipboard.writeText(fullShortUrl);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              🗂️ LinkSwift
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              ย่อลิงก์ด่วนพิเศษ พร้อมวัดผลสถิติแบบเรียลไทม์
            </p>
          </div>

          {/* Connection Status Panel */}
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-4 py-2.5 rounded-2xl text-xs">
            <span className="text-slate-400">Backend API:</span>
            {apiStatus.online ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                ออนไลน์
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                ออฟไลน์
              </span>
            )}

            <div className="w-px h-4 bg-slate-800" />

            <span className="text-slate-400">Database:</span>
            {apiStatus.online ? (
              apiStatus.supabase ? (
                <span className="text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  Supabase SQL
                </span>
              ) : (
                <span className="text-amber-400 font-medium bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60" title="ข้อมูลจะหายไปเมื่อเซิร์ฟเวอร์รีสตาร์ท">
                  In-Memory (RAM)
                </span>
              )
            ) : (
              <span className="text-slate-500">-</span>
            )}
          </div>
        </header>

        {/* Input Form & Success Result */}
        <section className="mb-12">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">ย่อลิงก์ใหม่ของคุณ</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="วางลิงก์ยาวๆ ที่นี่... (เช่น https://example.com/very-long-url)"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-sm focus:outline-none transition-all placeholder:text-slate-500 text-slate-100"
              />
              <button
                type="submit"
                disabled={loading || !longUrl}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 font-semibold px-6 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
              >
                {loading ? "กำลังสร้าง..." : "ย่อลิงก์ด่วน"}
              </button>
            </form>

            {error && (
              <div className="mt-4 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 px-4 py-3 rounded-2xl">
                ⚠️ {error}
              </div>
            )}

            {/* Result Box */}
            {successData && (
              <div className="mt-6 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">
                  ย่อลิงก์สำเร็จแล้ว!
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-100 truncate mb-1">
                      {successData.title}
                    </p>
                    <a
                      href={`${API_BASE_URL}/${successData.short_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-medium break-all underline decoration-dotted"
                    >
                      {`${API_BASE_URL}/${successData.short_code}`}
                    </a>
                  </div>
                  <button
                    onClick={() => handleCopy(successData.short_code)}
                    className="shrink-0 bg-slate-800 hover:bg-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 text-indigo-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === successData.short_code ? "✅ คัดลอกแล้ว" : "📋 คัดลอกลิงก์"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Dashboard Analytics Table */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">บอร์ดวิเคราะห์สถิติคนคลิก (Analytics)</h3>
            <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              ทราฟฟิกจริงในระบบ: {urls.length} ลิงก์
            </span>
          </div>

          {urls.length === 0 ? (
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-12 text-center border-dashed">
              <span className="text-4xl block mb-3">📁</span>
              <p className="text-slate-400 text-sm">ยังไม่มีการย่อลิงก์ในระบบ</p>
              <p className="text-xs text-slate-500 mt-1">ลองใส่ลิงก์ของคุณที่กล่องข้อความด้านบนเพื่อประเดิมคนแรก!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {urls.map((item) => {
                const fullShortUrl = `${API_BASE_URL}/${item.short_code}`;
                return (
                  <div
                    key={item.short_code}
                    className="bg-slate-900/30 hover:bg-slate-900/50 border border-slate-800/60 hover:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all shadow-sm"
                  >
                    {/* Link Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="text-sm font-bold text-slate-100 truncate max-w-md">
                          {item.title || "No Title"}
                        </h4>
                        <span className="shrink-0 text-[10px] text-slate-500">
                          {item.created_at.includes("Temporary") ? "RAM Storage" : new Date(item.created_at).toLocaleDateString("th-TH")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-indigo-950 text-indigo-400 font-semibold px-1.5 py-0.5 rounded border border-indigo-900/40">สั้น</span>
                          <a
                            href={fullShortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 truncate underline"
                          >
                            {fullShortUrl}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-950 text-slate-500 font-semibold px-1.5 py-0.5 rounded border border-slate-800">ปลายทาง</span>
                          <p className="text-xs text-slate-400 truncate max-w-sm md:max-w-xl">
                            {item.original_url}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t border-slate-800/50 pt-4 md:pt-0 md:border-t-0">
                      {/* Click Counter */}
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">ยอดคลิกสะสม</p>
                        <p className="text-xl font-black text-indigo-400 mt-0.5">
                          {item.clicks.toLocaleString()} <span className="text-xs font-medium text-slate-400">ครั้ง</span>
                        </p>
                      </div>

                      {/* Copy Action */}
                      <button
                        onClick={() => handleCopy(item.short_code)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          copiedId === item.short_code
                            ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50"
                            : "bg-slate-950 hover:bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {copiedId === item.short_code ? "✓ คัดลอกแล้ว" : "📋 คัดลอก"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 py-8 mt-12 border-t border-slate-900/80 text-center text-xs text-slate-500 relative z-10">
        <p>พัฒนาขึ้นเพื่อการเรียนรู้สถาปัตยกรรม Full-Stack & Deployment Workshop</p>
        <p className="mt-1">Next.js (Vercel) • FastAPI (Render) • PostgreSQL (Supabase)</p>
      </footer>
    </div>
  );
}
