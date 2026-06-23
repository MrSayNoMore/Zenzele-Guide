import React from "react";
import SplitZLogo from "./logo";
import { Facebook, Instagram, Twitter, MessageCircle } from "lucide-react";

const Footer = () => {
  const columns = [
    {
      title: "Navigate",
      links: [
        { label: "Student Portal", href: "/portal" },
        { label: "Jobs & Careers", href: "/jobs" },
        { label: "Bursaries", href: "/bursaries" },
        { label: "Blog & Guides", href: "/blog" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "APS Calculator", href: "/portal" },
        { label: "NSFAS Guide", href: "/blog/how-to-apply-nsfas-2026" },
        { label: "Institutions List", href: "/institutions" },
        { label: "Help & FAQ", href: "/faq" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Contact Us", href: "/contact" },
      ],
    },
  ];

  return (
    <footer className="bg-[#085041]">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand column */}
          <div className="md:col-span-2">
            <div className="mb-5">
              <SplitZLogo size="md" showWordmark={true} light={true} />
            </div>
            <p className="text-[#9FE1CB] text-sm leading-relaxed max-w-xs mb-6">
              Do it yourself — but not alone. The AI-powered guidance platform
              for South African matric and Grade 11 students.
            </p>
            <div className="flex gap-2">
              {[
                { icon: Facebook, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: MessageCircle, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.16)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.08)")
                  }
                >
                  <Icon size={16} color="#9FE1CB" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-5">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[#9FE1CB] text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact info row */}
        <div
          className="rounded-2xl px-6 py-4 mb-10 grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          {[
            { label: "Email", val: "hello@zenzeleguide.co.za" },
            { label: "WhatsApp", val: "+27 82 000 0000" },
            { label: "Location", val: "Johannesburg, South Africa" },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-[#9FE1CB]/60 text-[10px] font-black uppercase tracking-widest mb-0.5">
                {item.label}
              </p>
              <p className="text-[#9FE1CB] text-sm font-medium">{item.val}</p>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row justify-between items-center gap-3 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
        >
          <p className="text-[#9FE1CB]/70 text-xs">
            © 2026 Zenzele Guide (Pty) Ltd · Built for South African students ·{" "}
            <a
              href="https://zenzeleguide.co.za"
              className="hover:text-white transition-colors"
            >
              zenzeleguide.co.za
            </a>
          </p>
          <p className="text-[#9FE1CB]/50 text-xs">
            Empowering the class of 2026
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
