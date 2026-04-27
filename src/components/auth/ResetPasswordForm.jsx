import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { AuthCard } from "../../ui/AuthCard";
import { ButtonLoader } from "../global/Loader";
import { useResetPassword } from "../../hooks/useAuth";

/**
 * UI component responsible for rendering reset password form.
 */
export function ResetPasswordForm() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { mutate, isPending, isError, error, isSuccess, data } =
    useResetPassword();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const passwordCriteria = {
    hasMinLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    passwordsMatch:
      formData.password === formData.confirmPassword &&
      formData.confirmPassword !== "",
  };

  const isInvalid = Object.values(passwordCriteria).some(
    (criterion) => !criterion,
  );

  /**
   * Handles change behavior.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handles submit behavior.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({
      token: token,
      password: formData.password,
    });
  };

  useEffect(() => {
    if (isSuccess && data?.success) {
      toast.success(data.message);
      const timer = setTimeout(() => {
        navigate("/login");
      }, 1000);
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
      headerTitle="Nouveau départ"
      headerSubtitle="Définissez un mot de passe sécurisé pour votre compte AELI."
      title="Réinitialisation"
      subtitle="Entrez vos nouvelles informations"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          <Input
            label="Nouveau mot de passe"
            type="password"
            placeholder="*******"
            required
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            placeholder="*******"
            required
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />


          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sécurité du mot de passe
            </p>

            <ul className="space-y-2">
              {[
                {
                  label: "8 caractères minimum",
                  met: passwordCriteria.hasMinLength,
                },
                { label: "Une majuscule", met: passwordCriteria.hasUpperCase },
                { label: "Une minuscule", met: passwordCriteria.hasLowerCase },
                { label: "Un chiffre", met: passwordCriteria.hasNumber },
                {
                  label: "Confirmation identique",
                  met: passwordCriteria.passwordsMatch,
                },
              ].map((critere, index) => (
                <li
                  key={index}
                  className={`flex items-center gap-3 text-xs transition-colors duration-300 ${
                    critere.met
                      ? "text-green-600 font-medium"
                      : "text-slate-400"
                  }`}
                >
                  {critere.met ? (
                    <Circle size={14} className="text-green-500" />
                  ) : (
                    <Circle size={14} className="text-slate-300" />
                  )}
                  {critere.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isPending || isInvalid}
            >
              {isPending ? (
                <span key="loading-state" className="flex items-center gap-2">
                  <ButtonLoader />
                  Verification en cours...
                </span>
              ) : (
                <span key="idle-state">Confirmer</span>
              )}
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-500">
                Vous vous souvenez de votre mot de passe?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-[#E8524D] font-semibold hover:underline cursor-pointer bg-transparent border-none"
                >
                  Retour
                </button>
              </p>
            </div>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}
