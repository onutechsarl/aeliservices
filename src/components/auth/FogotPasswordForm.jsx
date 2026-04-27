import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from "react-toastify";
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { AuthCard } from '../../ui/AuthCard';
import { useForgotPassword } from '../../hooks/useAuth';

/**
 * UI component responsible for rendering forgot password form.
 */
export function ForgotPasswordForm() {
    const navigate = useNavigate()
    const { mutate, isPending, isError, error, isSuccess, data } = useForgotPassword();
    const [formData, setFormData] = useState({
        email: "",
    })

    const isInvalid = !formData.email;

    /**
     * Handles handle change behavior.
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    /**
     * Handles handle submit behavior.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        mutate(formData)
    }

    useEffect(() => {
        if (isSuccess && data?.success) {
            toast.success(data.message);
        }

        if (isError) {
            const errorMessage = error?.message;
            toast.error(errorMessage);
        }
    }, [isSuccess, isError, data, error]);

    return (
        <AuthCard
            headerTitle="Content de te revoir!"
            headerSubtitle="Utilisez ce formulaire pour vous connecter à votre compte."
            title="Mot de passe oublie"
            subtitle="Entrez votre email pour recevoir le lien"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-6">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="exemple@gmail.com"
                            required
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <div className="space-y-4">
                            <Button
                                type="submit"
                                variant="gradient"
                                size="lg"
                                di
                                className="w-full"
                                disabled={isPending || isInvalid}
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Envoi en cours...
                                    </span>
                                ) : (
                                    <span key="loading-state" className="flex items-center gap-2">
                                        Confirmer
                                    </span>
                                )}
                            </Button>
                            <div className="text-center pt-2">
                                <p className="text-sm text-slate-500">
                                    Vous vous souvenez de votre mot de passe?{' '}
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="text-[#E8524D] font-semibold hover:underline cursor-pointer bg-transparent border-none"
                                    >
                                        Retour
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AuthCard >
    )
}