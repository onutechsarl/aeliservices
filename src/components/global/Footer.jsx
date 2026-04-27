import React from "react";
import { Linkedin, Instagram, Facebook } from "lucide-react";

/**
 * UI component responsible for rendering the footer section.
 */
export function Footer() {
  return (
    <div className="mt-12 mb-8 flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-6">
        <a
          href="https://www.linkedin.com/company/aeli-services"
          className="text-slate-400 hover:text-purple-600 transition-colors"
        >
          <Linkedin className="w-5 h-5" />
        </a>
        <a
          href="https://www.instagram.com/aeli_services"
          className="text-slate-400 hover:text-purple-600 transition-colors"
        >
          <Instagram className="w-5 h-5" />
        </a>
        <a
          href="https://www.facebook.com/share/17yFQXXyPp/?mibextid=wwXIfr"
          className="text-slate-400 hover:text-purple-600 transition-colors"
        >
          <Facebook className="w-5 h-5" />
        </a>
        <a
          href="https://www.tiktok.com/@aeliservices"
          className="text-slate-400 hover:text-purple-600 transition-colors"
        >
          <svg height="23" width="23" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.2 10.1c0 .22-.18.401-.4.39a8 8 0 0 1-3.362-.93c-.281-.15-.638.045-.638.364V15.5a6 6 0 1 1-6.4-5.987a.38.38 0 0 1 .4.387v2.8c0 .22-.18.397-.398.433A2.4 2.4 0 1 0 12.2 15.5V2.9a.4.4 0 0 1 .4-.4h2.8a.43.43 0 0 1 .418.4a4.4 4.4 0 0 0 3.983 3.982c.22.02.4.197.4.418z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </a>
      </div>
      <p className="text-xs text-slate-400">
        Copyright © {new Date().getFullYear()} - AELI Service
      </p>
    </div>
  );
}
