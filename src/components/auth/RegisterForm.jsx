import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { toast } from "react-toastify";
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { AuthCard } from '../../ui/AuthCard';
import { useRegister } from '../../hooks/useAuth';

/**
 * UI component responsible for rendering register form.
 */
export function RegisterForm() {
  const navigate = useNavigate()
  const { mutate, isPending, isError, error, isSuccess, data } = useRegister();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Cameroun",
    gender: "male",
    password: "",
    confirmPassword: ""
  })

  const isInvalid =
    !formData.firstName ||
    !formData.lastName ||
    !formData.email ||
    !formData.password ||
    !formData.confirmPassword;

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

  const passwordCriteria = {
    hasMinLength: (formData.password || "").length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password || ""),
    hasLowerCase: /[a-z]/.test(formData.password || ""),
    hasNumber: /[0-9]/.test(formData.password || ""),
    passwordsMatch: formData.password === formData.confirmPassword && formData.confirmPassword !== ""
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
      navigate("/otp");
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
      headerTitle="Content de te voir!"
      headerSubtitle="Utilisez ce formulaires pour vous inscrire"
      title="Inscription"
      subtitle="Entrez vos informations afin de vous inscrire"
      isWide={true}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Input
              label="Nom"
              type="text"
              placeholder="Nom"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <Input
              label="Prenom"
              type="text"
              placeholder="Prenom"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <Input
              label="Genre"
              type="select"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { value: 'male', label: 'homme' },
                { value: 'female', label: 'femme' }
              ]}
              required
            />
            <Input
              label="Téléphone"
              type="number"
              placeholder="692 033 745"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-6">
            <Input
              label="Pays"
              type="text"
              placeholder="cameroun"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="exemple@gmail.com"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="*******"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Input
              label="Confirmer mot de passe"
              type="password"
              placeholder="*******"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-3 p-4 h-fit ">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sécurité du mot de passe
            </p>

            <ul className="space-y-2">
              {[
                { label: "8 caractères minimum", met: passwordCriteria.hasMinLength },
                { label: "Une majuscule", met: passwordCriteria.hasUpperCase },
                { label: "Une minuscule", met: passwordCriteria.hasLowerCase },
                { label: "Un chiffre", met: passwordCriteria.hasNumber },
                { label: "Confirmation identique", met: passwordCriteria.passwordsMatch },
              ].map((critere, index) => (
                <li
                  key={index}
                  className={`flex items-center gap-3 text-xs transition-colors duration-300 ${critere.met ? 'text-green-600 font-medium' : 'text-slate-400'
                    }`}
                >
                  {critere.met ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <Circle size={14} className="text-slate-300" />
                  )}
                  {critere.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-4 space-y-4 w-full md:ml-auto">
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              disabled={isPending || isInvalid}
              className="w-full"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Inscription...
                </span>
              ) : (
                <span key="loading-state" className="flex items-center gap-2">
                  Confirmer
                </span>
              )}
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <span className="relative bg-white px-4 text-sm text-slate-500">Ou</span>
            </div>

            {/* <Button type="button" variant="secondary" size="md" className="w-full gap-2 py-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button> */}

            <div className="text-center pt-2">
              <p className="text-sm text-slate-500">
                Vous avez déjà un compte?{' '}
                <button onClick={() => navigate('/login')} className="text-[#E8524D] font-semibold hover:underline">
                  Se connecter
                </button>
              </p>
            </div>
          </div>
        </div>
      </form>
    </AuthCard>
  )
}