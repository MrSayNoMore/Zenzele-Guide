import React from "react";
import Nav from "@/components/nav";
import Footer from "@/components/footer";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#EFEFEB] font-sans selection:bg-[#FAC775] selection:text-[#085041]">
      <Nav />
      <main>{children}</main>
      <Footer />

      {/* Global base styles */}
      <style jsx global>{`
        *, *::before, *::after {
          box-sizing: border-box;
        }
        html {
          scroll-behavior: smooth;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          font-weight: 400;
          color: #555555;
          line-height: 1.75;
          background-color: #EFEFEB;
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          font-weight: 900;
          color: #085041;
          letter-spacing: -0.5px;
          line-height: 1.15;
        }
        a {
          text-decoration: none;
          color: inherit;
        }
        input, select, textarea, button {
          font-family: inherit;
          outline: none;
        }
        input:focus, select:focus, textarea:focus {
          outline: none;
        }
        .tracked-label {
          font-weight: 200;
          letter-spacing: 0.5em;
          color: #1D9E75;
          text-transform: uppercase;
        }
        .border-1\\.5 {
          border-width: 1.5px;
        }
        /* Hide default focus ring, use custom ring-[#1D9E75] via Tailwind */
        :focus-visible {
          outline: 2px solid #1D9E75;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
