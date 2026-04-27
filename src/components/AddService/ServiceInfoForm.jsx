import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from "react-toastify";
import { Briefcase, X, Check, Loader2 } from 'lucide-react';
import { SectionHeader } from '../../ui/SectionHeader';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { FormCard } from '../../ui/FormCard';
import { useGetCategory, useCreateServices, useUpdateServices } from '../../hooks/useServices';

/**
 * UI component responsible for rendering service info form.
 */
export function ServiceInfoForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const dataEdit = location.state?.data || null;
    const isEditMode = !!dataEdit;
    const { data: categoryData } = useGetCategory();
    const { mutate: mutateCreate, isPending: isPendingCreate, data: serviceData, isSuccess: isSuccessCreate, isError: isErrorCreate, error: errorCreate, reset: resetCreate } = useCreateServices();
    const { mutate: mutateUpdate, isPending: isPendingUpdate, data: serviceDataUpdate, isSuccess: isSuccessUpdate, isError: isErrorUpdate, error: errorUpdate, reset: resetUpdate } = useUpdateServices();
    const categoriesFromApi = categoryData?.data?.categories || [];

    const categoryOptions = [
        { value: '', label: 'Choisir une catégorie...' },
        ...categoriesFromApi.map(cat => ({
            value: cat.id,
            label: cat.name
        }))
    ];

    const [formData, setFormData] = useState({
        photo: null, // On laisse à null car c'est un input file, mais on peut afficher une preview à part
        name: dataEdit?.name || '',
        price: dataEdit?.price || '',
        description: dataEdit?.description || '',
        categoryId: dataEdit?.categoryId || '',
        duration: dataEdit?.duration || ''
    });

    const isInvalid =
        !formData.categoryId ||
        (!isEditMode && !formData.photo) ||
        !formData.name ||
        !formData.description;

    /**
     * Handles handle change behavior.
     */
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'photo' ? files[0] : value
        }));
    };

    /**
     * Handles file to base64 behavior.
     */
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    /**
     * Handles handle submit behavior.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        const fData = new FormData();
        fData.append('name', formData.name);
        fData.append('description', formData.description);
        fData.append('price', Number(formData.price));
        fData.append('duration', Number(formData.duration));
        fData.append('categoryId', formData.categoryId);
        fData.append('priceType', "fixed");

        if (formData.photo instanceof File) {
            fData.append('photo', formData.photo);
        }

        if (isEditMode) {
            mutateUpdate({ id: dataEdit.id, formData: fData });
        } else {
            mutateCreate(fData);
        }
    };

    useEffect(() => {
        if (isSuccessCreate && serviceData?.success || isSuccessUpdate && serviceDataUpdate?.success) {
            toast.success(serviceData?.message || serviceDataUpdate?.message);
            navigate(-1);
        }

        if (isErrorCreate || isErrorUpdate) {
            const mainMessage = errorCreate?.message || errorUpdate?.message;
            toast.error(mainMessage);

            const backendErrors = errorCreate?.response?.errors || errorUpdate?.response?.errors;
            if (Array.isArray(backendErrors)) {
                backendErrors.forEach((err) => {
                    toast.info(err.message);
                });
            }
        }

        resetCreate();
        resetUpdate();

    }, [isSuccessCreate, isErrorCreate, serviceData, errorCreate, resetCreate, isSuccessUpdate, serviceDataUpdate, isErrorUpdate, errorUpdate, resetUpdate]);

    return (
        <FormCard
            title={isEditMode ? "Modifier le service" : "Ajouter un service"}
            subtitle={isEditMode ? "Modifiez les informations de votre service" : "Veuillez remplir les informations requises pour ajouter votre service"}
        >
            <form className="p-2 sm:p-4 space-y-10" onSubmit={handleSubmit}>
                <section className="mt-2">
                    <SectionHeader
                        icon={Briefcase}
                        title="Information sur le service"
                        colorClass="text-purple-600"
                    />

                    <div className="flex flex-col gap-y-6">
                        <Input
                            name="photo"
                            label="Photo"
                            type="file"
                            value={formData.photo}
                            onChange={handleChange}
                            previewImage={dataEdit?.photo}
                            required
                        />
                        <div className="flex flex-col md:flex-row gap-6">
                            <Input
                                name="categoryId"
                                label="Sélectionner la categorie"
                                type="select"
                                value={formData.categoryId}
                                onChange={handleChange}
                                titleButtonSelectAutre="ajouter votre categorie"
                                onAutres={() => navigate("/add-category")}
                                required
                                options={categoryOptions}
                            />
                            <Input
                                name="name"
                                label="Titre"
                                placeholder="Entrez le titre du service"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="flex flex-col md:flex-row gap-6">
                            <Input
                                name="price"
                                label="Prix"
                                type="number"
                                min={0}
                                placeholder="15000"
                                value={formData.price}
                                onChange={handleChange}
                            />
                            <Input
                                name="duration"
                                label="Durée"
                                type="number"
                                min={0}
                                placeholder="90"
                                value={formData.duration}
                                onChange={handleChange}
                            />
                        </div>

                        <Input
                            name="description"
                            label="Description du service"
                            type="textarea"
                            placeholder="Décrivez vos services..."
                            value={formData.description}
                            onChange={handleChange}
                            required
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
                        disabled={isPendingCreate || isPendingUpdate || isInvalid}
                    >

                        {(isPendingCreate || isPendingUpdate) ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verification...
                            </span>
                        ) : (
                            <span key="loading-state" className="flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                {isEditMode ? "Mettre à jour" : "Soumettre"}
                            </span>
                        )}
                    </Button>
                </div>
            </form>
        </FormCard>
    )
}