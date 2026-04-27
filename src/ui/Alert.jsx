import React from 'react';
import { AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';

const variants = {
    warning: {
        container: "bg-amber-50 border-amber-100",
        iconColor: "text-amber-600",
        titleColor: "text-amber-900",
        textColor: "text-amber-800/80",
        Icon: AlertTriangle
    },
    danger: {
        container: "bg-red-50 border-red-100",
        iconColor: "text-red-600",
        titleColor: "text-red-900",
        textColor: "text-red-800/80",
        Icon: AlertCircle
    },
    success: {
        container: "bg-emerald-50 border-emerald-100",
        iconColor: "text-emerald-600",
        titleColor: "text-emerald-900",
        textColor: "text-emerald-800/80",
        Icon: CheckCircle2
    },
    info: {
        container: "bg-blue-50 border-blue-100",
        iconColor: "text-blue-600",
        titleColor: "text-blue-900",
        textColor: "text-blue-800/80",
        Icon: Info
    }
};

export const Alert = ({
    variant = "warning",
    title,
    message,
    icon: CustomIcon,
    className = ""
}) => {
    const config = variants[variant] || variants.warning;
    const IconToRender = CustomIcon || config.Icon;

    return (
        <div className={`p-4 border rounded-md flex items-start gap-3 transition-all ${config.container} ${className}`}>
            <IconToRender className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
            <div className="space-y-1">
                {title && (
                    <p className={`text-xs font-black uppercase tracking-tight ${config.titleColor}`}>
                        {title}
                    </p>
                )}
                <p className={`text-[11px] leading-relaxed font-medium ${config.textColor}`}>
                    {message}
                </p>
            </div>
        </div>
    );
};