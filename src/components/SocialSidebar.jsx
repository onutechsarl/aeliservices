import React from 'react';
import { LinkedinIcon, FacebookIcon, InstagramIcon } from 'lucide-react';


export function SocialSidebar() {
    return (
        <aside
            className="flex lg:flex md:fixed md:left-0 md:top-1/2 -translate-y-1/2 z-40 md:flex-col  md:bg-black rounded-tr-lg rounded-br-lg gap-4 md:gap-0 mt-4 md:mt-auto justify-center "
            aria-label="Social media links"
        >
            <a
                href="https://www.linkedin.com/company/aeli-services"
                className=" w-9 h-9 md:w-13 md:h-13 bg-black flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-200  rounded-full md:rounded-none md:first:rounded-tr-lg"
                aria-label="Twitter"
            >
                <LinkedinIcon className="w-5 h-5" />
            </a>
            <a
                href="https://www.facebook.com/share/17yFQXXyPp/?mibextid=wwXIfr"
                className=" w-9 h-9 md:w-13 md:h-13 bg-black flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-200 rounded-full md:rounded-none"
                aria-label="Facebook"
            >
                <FacebookIcon className="w-5 h-5" />
            </a>
            <a
                href="https://www.instagram.com/aeli_services"
                className=" w-9 h-9 md:w-13 md:h-13 bg-black flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-200 rounded-full md:rounded-none md:rounded-br-lg"
                aria-label="Instagram"
            >
                <InstagramIcon className="w-5 h-5" />
            </a>
            <a
                href="https://www.tiktok.com/@aeliservices"
                className=" w-9 h-9 md:w-13 md:h-13 bg-black flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-200 rounded-full md:rounded-none md:rounded-br-lg"
                aria-label="Instagram"
            >
                <svg height="23" width="23" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.2 10.1c0 .22-.18.401-.4.39a8 8 0 0 1-3.362-.93c-.281-.15-.638.045-.638.364V15.5a6 6 0 1 1-6.4-5.987a.38.38 0 0 1 .4.387v2.8c0 .22-.18.397-.398.433A2.4 2.4 0 1 0 12.2 15.5V2.9a.4.4 0 0 1 .4-.4h2.8a.43.43 0 0 1 .418.4a4.4 4.4 0 0 0 3.983 3.982c.22.02.4.197.4.418z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
            </a>
        </aside>
    )
}
