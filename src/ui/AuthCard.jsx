import React from "react";
import { Footer } from "../components/global/Footer";

/**
 * UI component responsible for rendering auth card.
 */
export function AuthCard({
  title,
  subtitle,
  headerTitle,
  headerSubtitle,
  children,
  isWide = false,
}) {
  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-100 via-slate-50 to-white opacity-60"></div>

      <div className="flex flex-col items-center  min-h-screen w-full">
        <main className="w-full px-4 py-4 flex flex-col items-center ">
          { }
          <div className="w-full bg-slate-700 rounded-3xl min-h-[400px] p-8 pb-32 md:pb-48 text-center relative overflow-hidden shadow-lg">
            <img
              src="https://static.vecteezy.com/ti/photos-gratuite/t2/41927557-ai-genere-une-souriant-africain-femme-habille-dans-traditionnel-tenue-les-usages-sa-telephone-intelligent-dans-une-vibrant-marche-reglage-gratuit-photo.jpg"
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"></div>
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {headerTitle}
              </h1>
              <p className="text-slate-300 text-sm md:text-base max-w-md mx-auto">
                {headerSubtitle}
              </p>
            </div>
          </div>

          { }
          <div
            className={` relative
                        w-full bg-white rounded-2xl shadow-xl -mt-24 md:-mt-50 relative z-20 p-6 md:p-10 lg:p-12 border border-slate-100 transition-all duration-300
                        ${isWide ? "max-w-4xl" : "max-w-4xl md:max-w-[500px]"}
                    `}
          >
            <div className="absolute -top-20 left-0 right-0 flex flex-col justify-center items-center mb-8 ">
              <div className="relative bg-white rounded-full p-10 w-[200px] h-[200px] -z-1">
                <img
                  src="./logo.svg"
                  alt="logo"
                  className="w-25 absolute flex-shrink-0 -mt-4 ml-2"
                />
              </div>
              <span
                className={`font-bold text-xl  md:transition-opacity  -mt-20 z-2`}
              >
                AELI Services
              </span>
            </div>
            <div className="mb-8 mt-17 md:mt-10">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {title}
              </h2>
              <p className="text-slate-500 text-sm">{subtitle}</p>
            </div>
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
