import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { VideoPresentation } from './modal/VideoPresentation';
import { Button } from '../ui/Button';


export function HeroSection() {
    const [isVideoOpen, setIsVideoOpen] = useState(false)
    const handleOpenVideo = () => setIsVideoOpen(true)
    const handleCloseVideo = () => setIsVideoOpen(false)

    return (
        <section className="relative min-h-screen lg:min-h-[700px] w-full bg-white overflow-hidden">
            <div className="absolute inset-0 blur-[120px] -z-0 pointer-events-none" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center min-h-[500px] md:min-h-[600px] lg:min-h-[650px]">
                    <div className="w-full lg:w-1/2 pt-10 md:pt-16 lg:pt-0 pb-8 lg:pb-0">
                        <div className="flex items-center gap-3 mb-10">
                            <img src='./logo.png' alt='logo' className="w-20 h-20 flex-shrink-0" />
                            <span className="font-bold text-xl pacifico-regular">AELI Services</span>
                        </div>
                        <p className="text-base md:text-lg text-gray-600 mb-2 font-light">
                            En savoir plus sur{' '}
                            <span className="text-[#E8524D] font-semibold">AELI SERVICES</span>
                        </p>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
                            Le bon prestataire, juste là où vous en avez besoin.
                        </h1>
                        <div className="w-20 h-1 bg-[#E8524D] rounded-full mb-6" />
                        <p className="text-sm md:text-base text-gray-500 max-w-md leading-relaxed">
                            Fini le bouche-à-oreille incertain. Parcourez notre annuaire de prestataires qualifiés, comparez les profils et contactez directement l'expert pour vos travaux et services.
                        </p>
                        <div className="flex items-center gap-4 mt-4">

                            <a href="https://app.aeliservices.com/register">
                                <Button
                                    className="w-[200px] h-12 items-center justify-center"
                                >
                                    Commencer
                                </Button>
                            </a>
                        </div>
                    </div>
                    <div className="w-full mt-[18%] lg:mt-0 lg:w-1/2 relative lg:-right-20 flex justify-center h-[250px] md:h-[400px] lg:h-auto lg:justify-end">
                        <div className="absolute inset-0 lg:-top-20 lg:-bottom-20 h-[250px] md:h-[400px] lg:h-auto ">
                            <div
                                className="w-full h-full md:w-[500px] lg:w-full md:ml-[17%] lg:ml-auto bg-[radial-gradient(100%_100%_at_0%_0%,_rgba(0,0,0,1)_80%,_rgba(232,_82,_77,_1))] opacity-90"
                                style={{ borderRadius: '80% 20% 63% 37% / 26% 88% 12% 74%' }}
                            />
                        </div>
                        <div className="hidden lg:flex absolute top-4 left-1/2 -translate-x-1/2 lg:top-8 lg:-left-8 lg:translate-x-0 w-16 h-16 md:w-20 md:h-20 border-4 border-gray-200 rounded-full z-10 bg-white/50 backdrop-blur-sm" />
                        <div className="relative mt-8 md:mt-20 lg:mt-0 z-10 w-full max-w-md lg:max-w-none">
                            <img
                                src="./presentation-app.png"
                                alt="Person using E-Wallet digital payment on tablet"
                                className="w-full h-auto object-contain relative z-10"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <VideoPresentation
                isOpen={isVideoOpen}
                onClose={handleCloseVideo}
                videoSrc="./branding.mp4"
            />
        </section>
    )
}