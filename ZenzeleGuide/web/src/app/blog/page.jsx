import React, { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout-wrapper";
import {
  BookOpen,
  Clock,
  ArrowRight,
  Loader2,
  ChevronRight,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Varsity guides",
  "Bursaries",
  "APS tips",
  "Careers",
  "NSFAS",
];

const CATEGORY_COLORS = {
  "Varsity guides": { bg: "#085041", text: "#9FE1CB" },
  Bursaries: { bg: "#1D9E75", text: "#E1F5EE" },
  "APS tips": { bg: "#FAC775", text: "#085041" },
  Careers: { bg: "#1C1C1C", text: "#9FE1CB" },
  NSFAS: { bg: "#085041", text: "#FAC775" },
};

const DEFAULT_CARD_COLOR = { bg: "#1D9E75", text: "#E1F5EE" };

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/blog?category=${encodeURIComponent(category)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  return (
    <AppLayout>
      {/* Hero */}
      <div className="bg-[#085041] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#9FE1CB] mb-4">
              Guides & Insights
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight">
              Everything you need
              <br />
              to know
            </h1>
            <p className="text-lg text-[#9FE1CB] leading-relaxed">
              Step-by-step guides on APS scores, NSFAS applications, bursary
              hunting, and navigating the SA university system.
            </p>
          </div>
        </div>
        <div className="absolute -bottom-12 -right-12 opacity-[0.06] select-none pointer-events-none">
          <BookOpen size={320} />
        </div>
      </div>

      {/* Category filter */}
      <div className="bg-white border-b border-[#E8E7E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
                style={{
                  backgroundColor: category === c ? "#085041" : "#F4F3EF",
                  color: category === c ? "#ffffff" : "#555555",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blog grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2
              size={36}
              className="text-[#1D9E75] mb-3"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <p className="text-sm text-[#555] font-medium">
              Loading articles...
            </p>
            <style
              jsx
              global
            >{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, idx) => {
              const catStyle =
                CATEGORY_COLORS[post.category] || DEFAULT_CARD_COLOR;
              return (
                <a
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 transition-all"
                  style={{
                    border: "1.5px solid #E8E7E3",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Colored top */}
                  <div
                    className="px-6 py-6 relative"
                    style={{ backgroundColor: catStyle.bg }}
                  >
                    <span
                      className="text-[10px] font-black uppercase tracking-widest block mb-3"
                      style={{ color: catStyle.text, opacity: 0.8 }}
                    >
                      {post.category}
                    </span>
                    <h3
                      className="font-black text-lg leading-snug line-clamp-2 group-hover:opacity-90 transition-opacity"
                      style={{ color: "#ffffff" }}
                    >
                      {post.title}
                    </h3>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-sm text-[#555555] leading-relaxed line-clamp-3 flex-1 mb-5">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-[#F3F2EF]">
                      <span className="flex items-center gap-1.5 text-xs text-[#888] font-medium">
                        <Clock size={12} />
                        {post.read_time_minutes} min read
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-[#1D9E75] group-hover:text-[#085041] transition-colors">
                        Read more <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpen
              size={48}
              className="mx-auto mb-4"
              style={{ color: "#E8E7E3" }}
            />
            <h3 className="text-xl font-black text-[#085041] mb-2">
              No articles yet
            </h3>
            <p className="text-sm text-[#555]">
              Check back soon — new guides are added weekly.
            </p>
          </div>
        )}
      </div>

      {/* Newsletter */}
      <section className="py-16 bg-[#EFEFEB]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl overflow-hidden grid md:grid-cols-2"
            style={{ border: "1.5px solid #E8E7E3" }}
          >
            <div className="bg-white p-10">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#1D9E75] mb-3">
                Newsletter
              </p>
              <h3 className="text-2xl font-black text-[#085041] mb-3">
                Stay one step ahead
              </h3>
              <p className="text-sm text-[#555] leading-relaxed mb-6">
                Get weekly updates on bursary deadlines, new learnerships, and
                application tips straight to your inbox.
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 text-[#1D9E75] font-bold">
                  ✓ You're subscribed — check your inbox!
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-col gap-3"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-[#EFEFEB] border-none rounded-xl px-4 py-3 text-sm font-medium text-[#085041] focus:ring-2 ring-[#1D9E75]"
                    required
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-[#085041] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0c6b57] transition-all"
                  >
                    Subscribe <ArrowRight size={15} />
                  </button>
                </form>
              )}
            </div>
            <div
              className="p-10 flex flex-col justify-center gap-5"
              style={{
                background: "linear-gradient(135deg, #1D9E75, #085041)",
              }}
            >
              {[
                { val: "Weekly", label: "New guides published" },
                { val: "100%", label: "Free — always" },
                { val: "0", label: "Spam, ever" },
              ].map((item, i) => (
                <div key={i}>
                  <p className="text-white font-black text-2xl">{item.val}</p>
                  <p className="text-[#9FE1CB] text-sm">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
