import React from 'react'

/**
 * UI component responsible for rendering form card.
 */
export function FormCard({
    children,
    title,
    subtitle,
    gradientFrom = "from-[#E8524D]",
    gradientTo = "to-[#FCE0D6]",
}) {
    return (
        <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 font-sans relative">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] -left-[5%] w-[350px] h-[350px] bg-purple-500/30 rounded-full blur-[100px]" />
                <div className="absolute top-[5%] -right-[5%] w-[400px] h-[400px] bg-yellow-200/40 rounded-full blur-[110px]" />
                <div className="absolute bottom-[20%] left-[30%] w-[300px] h-[300px] bg-blue-100/60 rounded-full blur-[90px]" />
            </div>

            <div className="flex items-center gap-3 mb-10">
                <img src='./aelilogo.svg' alt='logo' className="w-10 h-10 flex-shrink-0" />
                <span className={`font-bold text-xl  md:transition-opacity pacifico-regular `}>
                    AELI Services
                </span>
            </div>
            <div className="relative z-10 mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
                <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} px-6 py-8 sm:px-10`}>
                    <h1 className="text-3xl font-bold text-white sm:text-3xl pacifico-regular">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-2 text-purple-100">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className="p-6 sm:p-8 md:p-10">
                    {children}
                </div>
            </div>
        </div >
    )
}