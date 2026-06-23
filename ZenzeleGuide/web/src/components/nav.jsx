import React, { useState, useEffect } from "react";
import SplitZLogo from "./logo";
import { Menu, X, ArrowRight } from "lucide-react";

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { name: "Student Portal", href: "/portal" },
    { name: "Jobs", href: "/jobs" },
    { name: "Bursaries", href: "/bursaries" },
    { name: "Blog", href: "/blog" },
  ];

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        backgroundColor: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid #E8E7E3",
        boxShadow: scrolled ? "0 4px 24px rgba(8,80,65,0.08)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[70px]">
          <a href="/" className="flex-shrink-0">
            <SplitZLogo size="md" showWordmark={true} />
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative px-4 py-2 text-sm font-semibold text-[#1C1C1C] hover:text-[#085041] transition-colors rounded-lg hover:bg-[#E1F5EE]/60"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/portal"
              className="inline-flex items-center gap-2 bg-[#085041] text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all hover:bg-[#0c6b57] active:scale-95"
              style={{ boxShadow: "0 2px 8px rgba(8,80,65,0.25)" }}
            >
              Check my options
              <ArrowRight size={14} strokeWidth={2.5} />
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-[#085041] hover:bg-[#E1F5EE] transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-[#E8E7E3]">
          <div className="px-4 py-3 space-y-1">
            <a
              href="/"
              className="flex items-center px-4 py-3 text-sm font-semibold text-[#1C1C1C] hover:bg-[#E1F5EE] hover:text-[#085041] rounded-xl transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </a>
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="flex items-center px-4 py-3 text-sm font-semibold text-[#1C1C1C] hover:bg-[#E1F5EE] hover:text-[#085041] rounded-xl transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="pt-2 pb-1">
              <a
                href="/portal"
                className="flex items-center justify-center gap-2 w-full bg-[#085041] text-white py-3.5 rounded-xl font-bold text-sm"
                onClick={() => setIsOpen(false)}
              >
                Check my options <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Nav;
