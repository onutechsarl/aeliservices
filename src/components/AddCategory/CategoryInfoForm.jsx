import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import { Briefcase, X, Check, Loader2 } from 'lucide-react';
import { SectionHeader } from '../../ui/SectionHeader';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { FormCard } from '../../ui/FormCard';
import { useCreateCategories } from '../../hooks/useServices';

/**
 * UI component responsible for rendering category info form.
 */
export function CategoryInfoForm() {
    const navigate = useNavigate()
    const { mutate: createCategory, isPending, isSuccess, isError, data, error } = useCreateCategories();
    const [formData, setFormData] = useState({
        name: "",
        description: ""
    })

    const isInvalid = !formData.name;

    /**
     * Handles handle change behavior.
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    /**
     * Handles handle submit behavior.
     */
    const handleSubmit = (e) => {
        e.preventDefault()
        createCategory(formData);
    }

    useEffect(() => {
        if (isSuccess && data?.success) {
            toast.success(data.message);
            navigate(-1);
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
        <FormCard
            title="Ajouter une categorie"
            subtitle="Veuillez remplir les informations requises pour ajouter votre categorie"
        >
            <form className="p-2 sm:p-4 space-y-10" onSubmit={handleSubmit}>
                <section className="mt-2">
                    <SectionHeader
                        icon={Briefcase}
                        title="Information sur la categorie"
                        colorClass="text-purple-600"
                    />

                    <div className="flex flex-col gap-y-6">

                        <Input
                            name="name"
                            label="categorie"
                            placeholder="Entrez une categorie"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            name="description"
                            label="Description "
                            type="textarea"
                            placeholder="Vos services..."
                            value={formData.description}
                            onChange={handleChange}
                        />

                    </div>
                </section>
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
                    <Button
                        variant="secondary"
                        className="w-full sm:w-auto gap-2 py-3"
                        type="button"
                        onClick={() => navigate(-1)}
                    >
                        <X className="w-4 h-4" />
                        Retour
                    </Button>

                    <Button
                        variant="gradient"
                        type="submit"
                        className="w-full sm:w-auto gap-2 px-8 py-3"
                        disabled={isInvalid || isPending}
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verification...
                            </span>
                        ) : (
                            <span key="loading-state" className="flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Soumettre
                            </span>
                        )}

                    </Button>
                </div>
            </form>
        </FormCard>
    )
}