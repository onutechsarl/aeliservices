import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from "react-toastify";
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { AuthCard } from '../../ui/AuthCard';
import { useLogin } from '../../hooks/useAuth';

/**
 * UI component responsible for rendering login form.
 */
export function LoginForm() {
    const navigate = useNavigate()
    const { mutate, isPending, isError, error, isSuccess, data } = useLogin();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })

    const isInvalid =
        !formData.email ||
        !formData.password;

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
            localStorage.setItem('accessToken', data.data.accessToken);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            toast.success(data.message);
            navigate("/home");
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
    }, [isSuccess, isError, data, error]);

    return (
        <AuthCard
            headerTitle="Content de te revoir!"
            headerSubtitle="Utilisez ce formulaire pour vous connecter à votre compte."
            title="Connexion"
            subtitle="Entrez vos informations pour accéder à votre espace"
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
                        <Input
                            label="Mot de passe"
                            type="password"
                            placeholder="*******"
                            required
                            name="password"
                            value={formData.password}
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
                                        Connexion...
                                    </span>
                                ) : (
                                    <span key="loading-state" className="flex items-center gap-2">
                                        Confirmer
                                    </span>
                                )}
                            </Button>
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={() => navigate('/forgot-password')}
                                    className=" text-sm text-[#E8524D] font-semibold hover:underline cursor-pointer bg-transparent border-none "
                                >
                                    Mot de passe oublié?
                                </button>
                            </div>
                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <span className="relative bg-white px-4 text-sm text-slate-500">
                                    Ou
                                </span>
                            </div>
                            {/* <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                className="w-full gap-2 py-3"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span>Google</span>
                            </Button> */}
                            <div className="text-center pt-2">
                                <p className="text-sm text-slate-500">
                                    Vous n'avez pas encore de compte?{' '}
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="text-[#E8524D] font-semibold hover:underline cursor-pointer bg-transparent border-none"
                                    >
                                        S'inscrire
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