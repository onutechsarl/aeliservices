import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from "react-toastify";
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { AuthCard } from '../../ui/AuthCard';
import { useOtp } from '../../hooks/useAuth';
import { useResendOtp } from '../../hooks/useAuth';

/**
 * UI component responsible for rendering otp form.
 */
export function OtpForm() {
    const navigate = useNavigate();
    const location = useLocation();

    const { mutate, isPending, isError, error, isSuccess, data } = useOtp();
    const {
        mutate: mutateResend,
        isPending: isPendingResend,
        isError: isErrorResend,
        error: errorResend,
        isSuccess: isSuccessResend,
        data: dataResend
    } = useResendOtp();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [formData, setFormData] = useState({
        email: location.state?.email || "",
        otp: ""
    });

    const inputRefs = useRef([]);

    /**
     * Handles handle input change behavior.
     */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Handles handle otp change behavior.
     */
    const handleOtpChange = (value, index) => {
        const char = value.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = char;
        setOtp(newOtp);

        const fullOtp = newOtp.join('');
        setFormData(prev => ({ ...prev, otp: fullOtp }));

        if (char && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    /**
     * Handles handle key down behavior.
     */
    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    /**
     * Handles handle paste behavior.
     */
    const handlePaste = (e) => {
        const pasteData = e.clipboardData.getData('text').trim().slice(0, 6).split('');
        if (pasteData.length > 0) {
            const newOtp = [...otp];
            pasteData.forEach((char, index) => {
                if (index < 6) newOtp[index] = char;
            });
            setOtp(newOtp);
            setFormData(prev => ({ ...prev, otp: newOtp.join('') }));

            const nextFocus = pasteData.length >= 6 ? 5 : pasteData.length;
            inputRefs.current[nextFocus]?.focus();
        }
    };

    /**
     * Handles handle submit behavior.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        mutate(formData);
    };

    /**
     * Handles handle resend otp behavior.
     */
    const handleResendOtp = () => {
        if (!formData.email) {
            return toast.error("Veuillez renseigner votre email pour renvoyer le code");
        }
        mutateResend({ email: formData.email });
    };

    useEffect(() => {
        if (isSuccess && data?.success) {
            toast.success(data.message);
            navigate("/login");
        }

        if (isError) {
            const mainMessage = error?.message;
            toast.error(mainMessage);

            const backendErrors = error?.response?.errors;
            if (Array.isArray(backendErrors)) {
                backendErrors.forEach((err) => {
                    toast.info(err.message);
                });
            }
        }

        if (isSuccessResend && dataResend?.success) {
            toast.success(dataResend.message);
        }

        if (isErrorResend) {
            toast.error(errorResend?.message);
        }

        if (isErrorResend) {
            const mainMessage = errorResend?.message;
            toast.error(mainMessage);

            const backendErrors = errorResend?.response?.errors;
            if (Array.isArray(backendErrors)) {
                backendErrors.forEach((err) => {
                    toast.info(err.message);
                });
            }
        }
    }, [isSuccess, isError, isSuccessResend, isErrorResend, data, error, dataResend, errorResend, navigate]);

    return (
        <AuthCard
            headerTitle="Vérification"
            headerSubtitle="Entrez le code à 6 chiffres envoyé par mail"
            title="OTP"
            subtitle="Vérification du compte"
        >
            <form onSubmit={handleSubmit} className="space-y-8">
                <Input
                    label="Email"
                    type="email"
                    placeholder="exemple@gmail.com"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                />

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Code OTP <span className="text-red-500">*</span>
                    </label>
                    <div className="flex justify-between gap-1 md:gap-2" onPaste={handlePaste}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(e.target.value, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="w-10 h-14 md:w-12 md:h-16 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FCE0D6] outline-none transition-all"
                            />
                        ))}
                    </div>
                </div>

                <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    className="w-full py-4 text-xs tracking-widest uppercase"
                    disabled={isPending || otp.some((d) => d === '')}
                >
                    {isPending ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Vérification...
                        </span>
                    ) : (
                        <span key="loading-state" className="flex items-center gap-2">
                            Vérifier
                        </span>
                    )}
                </Button>

                <div className="text-center">
                    <p className="text-sm text-slate-500">
                        Vous n'avez pas reçu de code ?{' '}
                        <button
                            type="button"
                            disabled={isPendingResend}
                            onClick={handleResendOtp}
                            className="text-[#E8524D] font-bold hover:underline disabled:opacity-50">
                            {isPendingResend ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Envoi...
                                </span>
                            ) : (
                                <span key="loading-state" className="flex items-center gap-2">
                                    Renvoyer
                                </span>
                            )}
                        </button>
                    </p>
                </div>
            </form>
        </AuthCard>
    );
}