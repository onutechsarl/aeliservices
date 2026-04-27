import React, { useState, useEffect } from 'react';


export function MoreThanLogin() {
  const images = [
    "./login.png",
    "./home.png",
    "./sidebar.png",
    "./profile.png",
    "./abonnement.png",
    "./spaceprovider.png"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="pb-32 relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* En-tête */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Bien plus qu'un accès, <br /> tout un écosystème
          </h2>
          <p className="text-gray-500 text-lg">
            Découvrez la puissance de la plateforme AELI Services. Notre interface intuitive
            centralise tous vos outils : gestion de profil, mise en avant de vos services et
            suivi d'opportunités, pour vous permettre de piloter votre activité avec une
            fluidité absolue.
          </p>
        </div>

        {/* Zone centrale */}
        <div className="relative max-w-4xl mx-auto flex justify-center items-center h-[500px]">
          {/* Éléments décoratifs de fond */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8B5CF6]/5 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-[#FCE0D6]/15 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] border border-gray-300 rounded-[100%] transform -rotate-12"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] border border-gray-300 rounded-[100%] transform -rotate-12"></div>

          {/* Éléments flottants */}
          <div className="absolute left-[10%] top-[40%] w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-lg z-10">
            <div className="w-6 h-6 rounded-full bg-[#FCE0D6]/30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#FCE0D6]"></div>
            </div>
          </div>
          <div className="absolute right-[20%] top-[20%] w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-lg z-10">
            <div className="w-4 h-4 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6]"></div>
            </div>
          </div>
          <div className="absolute right-[15%] bottom-[30%] w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-lg z-10">
            <div className="w-6 h-6 rounded-full bg-[#FCE0D6]/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#FCE0D6]/80"></div>
            </div>
          </div>
          <div className="relative z-20 w-[280px] h-[600px]">
            <div className="absolute -left-1 top-24 w-1 h-12 bg-gray-700 rounded-l-lg"></div>
            <div className="absolute -left-1 top-40 w-1 h-16 bg-gray-700 rounded-l-lg"></div>
            <div className="absolute -right-1 top-32 w-1 h-20 bg-gray-700 rounded-r-lg"></div>
            <div className="w-full h-full bg-gray-800 rounded-[40px] p-2 shadow-2xl shadow-[#8B5CF6]/10 border border-gray-800 overflow-hidden">
              <div className="relative w-full h-full rounded-[32px] overflow-hidden">
                <img src="./objectif.png" alt="" className="absolute top-2 left-[47%] w-3 z-10" />
                {images.map((img, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? "opacity-100" : "opacity-0"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`Slide ${index}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}