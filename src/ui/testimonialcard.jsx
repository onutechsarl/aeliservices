import React from "react";


export function TestimonialCard({ name, role, avatar, quote }) {
    return (
        <div className="relative bg-white border border-[#8B5CF6]/10 rounded-2xl p-6 h-full shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <img
                    src={avatar}
                    alt={name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                />
                <div>
                    <p className="text-gray-900 font-semibold text-sm">{name}</p>
                    <p className="text-gray-400 text-xs">{role}</p>
                </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{quote}</p>
        </div>
    );
}