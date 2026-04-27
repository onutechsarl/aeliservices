import React from 'react';
import { Instagram, Linkedin, Github } from 'lucide-react';
import { Button } from '../ui/Button';



export function Footer() {
    return (
        <div className="relative w-full flex flex-col items-center pt-0 overflow-hidden z-0 bg-white pb-30 md:pb-40 md:h-auto lg:pb-0 lg:min-h-[710px]">
            <section className="w-[calc(100%-2rem)] max-w-7xl mx-auto rounded-[2.5rem] bg-black relative overflow-hidden py-24 md:py-32 px-6 text-center flex flex-col items-center justify-center shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(100%_100%_at_50%_0%,rgba(0,0,0,1)_80%,rgba(232,_82,_77,_1))] pointer-events-none"></div>

                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10 tracking-tight">
                    Prête à propulser votre activité ?
                </h2>

                <p className="text-gray-300 text-base md:text-lg max-w-2xl mb-10 relative z-10">
                    Rejoignez la communauté AELI Services. Gérez vos profils,
                    <br className="hidden md:block" /> valorisez vos services et saisissez les opportunités
                    <br className="hidden md:block" /> qui feront grandir votre entrepreneuriat dès aujourd'hui.
                </p>
                <a
                    href="https://app.aeliservices.com/register">
                    <Button variant="light">
                        Créer mon compte
                    </Button>
                </a>
            </section>
            <div className="absolute bottom-[-5%] md:bottom-[-10%] lg:bottom-[-19%]  left-1/2 -translate-x-1/2 text-[22vw] font-bold text-[#f5f5f5] leading-none select-none pointer-events-none z-0 whitespace-nowrap tracking-tighter">
                AELI SERVICES
            </div>
        </div>
    )
}
