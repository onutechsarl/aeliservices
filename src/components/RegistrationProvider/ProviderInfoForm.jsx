import React, { useState, useEffect } from 'react';
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, X, Check, MapPin, Loader2 } from 'lucide-react';
import { SectionHeader } from '../../ui/SectionHeader';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { FormCard } from '../../ui/FormCard';
import { availableActivities } from './AvailableActivities';
import { TermsSection } from "./TermsSection";
import { MapPicker } from '../global/MapPicker';
import { useInfoUserConnected } from '../../hooks/useUser';
import { useApplyProvider, useUpdateProviderProfile } from '../../hooks/useProvider';


export function ProviderInfoForm() {
    const navigate = useNavigate()
    const [agreed, setAgreed] = useState(false)
    const [showMapModal, setShowMapModal] = useState(false)
    const { data: userData } = useInfoUserConnected();
    const { mutate: mutateApply, isPending: isPendingApply, isError: isErrorApply, error: errorApply, isSuccess: isSuccessApply, data: dataApply, reset: resetApply } = useApplyProvider();
    const { mutate: mutateUpdate, isPending: isPendingUpdate, isError: isErrorUpdate, error: errorUpdate, isSuccess: isSuccessUpdate, data: dataUpdate, reset: resetUpdate } = useUpdateProviderProfile();

    const user = userData?.data?.user;
    const provider = userData?.data?.provider;
    const isEditMode = Boolean(provider?._id || provider?.id);
    const providerId = provider?._id || provider?.id;

    useEffect(() => {
        if (isEditMode) setAgreed(true);
    }, [isEditMode]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        gender: '',
        country: '',
        email: '',
        phone: '',
        cniNumber: '',
        imgcnirecto: null,
        imgcniverso: null,
        photos: null,
        businessContact: '',
        whatsapp: '',
        businessName: '',
        location: '',
        address: '',
        latitude: '',
        longitude: '',
        description: '',
        activities: []
    })

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                gender: user.gender || '',
                country: user.country || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
        }
    }, [user]);

    useEffect(() => {
        if (provider) {
            const rectoDoc = provider.documents?.find(d => d.type === 'cni_recto');
            const versoDoc = provider.documents?.find(d => d.type === 'cni_verso');
            const cleanWhatsapp = (val) => {
                if (!val) return '';
                if (val.includes(':') || val.length > 20) return '';
                return val;
            }
            setFormData(prev => ({
                ...prev,
                cniNumber: provider.cniNumber || '',
                // On récupère les URLs des images existantes pour la prévisualisation
                imgcnirecto: rectoDoc?.url || null,
                imgcniverso: versoDoc?.url || null,
                photos: provider.profilePhoto || provider.photo || provider.photos || null,
                businessContact: provider.businessContact || '',
                whatsapp: cleanWhatsapp(provider.whatsapp),
                businessName: provider.businessName || '',
                location: provider.location || '',
                address: provider.address || '',
                latitude: provider.latitude || '',
                longitude: provider.longitude || '',
                description: provider.description || '',
                activities: Array.isArray(provider.activities) ? provider.activities : []
            }));
        }
    }, [provider]);

    const isInvalidBase = [formData.businessName, formData.location, formData.description].some(v => !v) || formData.activities.length === 0;
    const isInvalidIdentity = !isEditMode && [formData.cniNumber, formData.imgcnirecto, formData.imgcniverso].some(v => !v);
    const isInvalid = isInvalidBase || (isInvalidIdentity);
    const isPending = isPendingApply || isPendingUpdate;

    const handleAddActivity = (e) => {
        const selected = e.target.value
        if (selected && !formData.activities.includes(selected)) {
            setFormData(prev => ({ ...prev, activities: [...prev.activities, selected] }))
        }
        e.target.value = ""
    }

    const removeActivity = (activityToRemove) => {
        if (isEditMode) return; // Optionnel : empêcher de retirer des activités en mode édition 
        setFormData(prev => ({ ...prev, activities: prev.activities.filter(act => act !== activityToRemove) }))
    }

    const handleConfirmLocation = (mapData) => {
        setFormData(prev => ({ ...prev, location: mapData.address, latitude: mapData.lat, longitude: mapData.lon }))
        setShowMapModal(false)
    }

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) return toast.error("Géolocalisation non supportée");
        toast.info("Recherche de votre position...");
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();
                setFormData(prev => ({ ...prev, location: data.display_name, latitude: latitude.toString(), longitude: longitude.toString() }));
                toast.success("Position trouvée !");
            } catch (e) {
                setFormData(prev => ({ ...prev, latitude: latitude.toString(), longitude: longitude.toString() }));
            }
        }, () => toast.error("Erreur GPS"), { enableHighAccuracy: true });
    };

    const handleChange = (e) => {
        if (isEditMode && (e.target.name === 'imgcnirecto' || e.target.name === 'imgcniverso' || e.target.name === 'cniNumber')) return;
        const { name, value, type, files } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'file' ? files?.[0] : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSend = new FormData();
        dataToSend.append('businessName', formData.businessName);
        dataToSend.append('description', formData.description);
        dataToSend.append('location', formData.location);
        dataToSend.append('address', formData.address || '');
        dataToSend.append('whatsapp', formData.whatsapp || '');
        dataToSend.append('businessContact', formData.businessContact || '');
        dataToSend.append('latitude', formData.latitude || '');
        dataToSend.append('longitude', formData.longitude || '');
        dataToSend.append('activities', JSON.stringify(formData.activities));

        if (isEditMode) {
            if (formData.photos instanceof File) dataToSend.append('logo', formData.photos);
            mutateUpdate({ id: providerId, formData: dataToSend });
        } else {
            dataToSend.append('firstName', formData.firstName);
            dataToSend.append('lastName', formData.lastName);
            dataToSend.append('email', formData.email);
            dataToSend.append('phone', formData.phone);
            dataToSend.append('cniNumber', formData.cniNumber);
            if (formData.imgcnirecto instanceof File) dataToSend.append('imgcnirecto', formData.imgcnirecto);
            if (formData.imgcniverso instanceof File) dataToSend.append('imgcniverso', formData.imgcniverso);
            mutateApply(dataToSend);
        }
    };

    useEffect(() => {
        if ((isSuccessApply && dataApply?.success) || (isSuccessUpdate && dataUpdate?.success)) {
            toast.success(dataApply?.message || dataUpdate?.message);
            navigate(-1);
        }
        const error = errorApply || errorUpdate;
        if (error) toast.error(error.response?.data?.message || error.message);


        if (isErrorApply || isErrorApply) {
            const mainMessage = errorApply?.message || errorUpdate?.message;
            toast.error(mainMessage);

            const backendErrors = errorApply?.response?.errors || errorUpdate?.response?.errors;
            if (Array.isArray(backendErrors)) {
                backendErrors.forEach((err) => {
                    toast.info(err.message);
                });
            }
        }

        resetApply()
        resetUpdate()

    }, [isSuccessApply, isSuccessUpdate, isErrorApply, isErrorUpdate, resetApply, dataApply, dataUpdate, errorApply, errorUpdate, resetUpdate]);

    return (
        <FormCard
            title={isEditMode ? "Modification Prestataire" : "Inscription Prestataire"}
            subtitle={isEditMode ? "Consultez vos documents et modifiez votre activité" : "Complétez votre inscription"}
        >
            <form onSubmit={handleSubmit} className="relative space-y-10">
                {!isEditMode &&
                    <section>
                        <SectionHeader icon={User} title="Informations Personnelles" colorClass="text-blue-600" />
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <Input name="firstName" label="Nom" value={formData.firstName} isreadOnly readOnly />
                            <Input name="lastName" label="Prénom" value={formData.lastName} isreadOnly readOnly />
                            <Input name="gender" label="Genre" value={formData.gender} isreadOnly readOnly />
                            <Input name="email" label="Adresse E-mail" value={formData.email} isreadOnly readOnly />
                            <Input name="phone" label="Téléphone" value={formData.phone} isreadOnly readOnly />
                        </div>
                    </section>
                }

                <section>
                    <SectionHeader icon={Briefcase} title="Informations sur la Structure" colorClass="text-purple-600" />
                    <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 w-full">
                        {/* Champs CNI : Toujours visibles, mais bloqués en mode édition */}
                        {!isEditMode &&
                            <div className="flex flex-col gap-6">
                                <Input
                                    name="cniNumber"
                                    label="Numéro CNI"
                                    value={formData.cniNumber}
                                    onChange={handleChange}
                                    required
                                    isreadOnly={isEditMode}
                                    readOnly={isEditMode}
                                />
                                <div className="flex flex-col md:flex-row gap-6">
                                    <Input
                                        name="imgcnirecto"
                                        label="Photo CNI Recto"
                                        type="file"
                                        onChange={handleChange}
                                        required={!isEditMode}
                                        previewImage={typeof formData.imgcnirecto === 'string' ? formData.imgcnirecto : undefined}
                                        className="h-[150px]"
                                        disabled={isEditMode}
                                    />
                                    <Input
                                        name="imgcniverso"
                                        label="Photo CNI Verso"
                                        type="file"
                                        onChange={handleChange}
                                        required={!isEditMode}
                                        previewImage={typeof formData.imgcniverso === 'string' ? formData.imgcniverso : undefined}
                                        className="h-[150px]"
                                        disabled={isEditMode}
                                    />
                                </div>
                            </div>
                        }

                        {isEditMode && (
                            <Input
                                name="photos"
                                label="Photo / Logo"
                                type="file"
                                previewImage={typeof formData.photos === 'string' ? formData.photos : undefined}
                                onChange={handleChange}
                                accept="image/*"
                                className="h-[250px]"
                            />
                        )}
                        <Input name="businessName" label="Entreprise" value={formData.businessName} onChange={handleChange} required />
                        <Input name="businessContact" label="Contact Pro" type="number" value={formData.businessContact} onChange={handleChange} required />
                        <div className={`space-y-3 ${!isEditMode ? "md:-mt-50" : "md:md:-mt-50"}`}>
                            <Input name="whatsapp" label="Contact whatsapp" type="text" value={formData.whatsapp} onChange={handleChange} required />
                        </div>
                        <Input name="address" label="Address (optionel)" value={formData.address} onChange={handleChange} className="flex-1" />

                        <div className={`flex flex-col gap-2 ${!isEditMode ? "md:-mt-50" : "md:-mt-50"}`}>
                            <label className="text-sm font-medium text-gray-700">Localisation *</label>
                            <div className="flex flex-col gap-4">
                                <Input name="location" value={formData.location} isreadOnly readOnly className="flex-1" />
                                <div className="flex gap-4">
                                    <Button type="button" variant="outline" onClick={handleGetCurrentLocation} className="flex-1 h-[49px] gap-2"><MapPin size={18} /> Position</Button>
                                    <Button type="button" variant="softRed" onClick={() => setShowMapModal(true)} className="flex-1 h-[49px] gap-2"><MapPin size={18} /> Carte</Button>
                                </div>
                            </div>
                        </div>

                        {showMapModal && <MapPicker onClose={() => setShowMapModal(false)} onConfirm={handleConfirmLocation} />}

                        <div className={`space-y-3 `}>
                            <Input
                                name="activities"
                                label="Sélectionner vos activités"
                                type="select"
                                onChange={handleAddActivity}
                                disabled={isEditMode}
                                options={[{ value: '', label: 'Choisir...' }, ...availableActivities.filter(act => !formData.activities.includes(act)).map(act => ({ value: act, label: act }))]}
                            />
                            <div className="flex flex-wrap gap-2">
                                {formData.activities.map((act) => (
                                    <span key={act} className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-500 text-sm font-medium rounded-full border border-red-100">
                                        {act}
                                        {!isEditMode && <button type="button" onClick={() => removeActivity(act)}><X size={14} /></button>}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>
                </section>
                <div className={` ${!isEditMode ? "-mt-7 md:-mt-0 md:absolute md:bottom-233 md:right-0 md:ml-8 md:w-[48.5%]" : "w-full md:w-[48%] -mt-4 md:absolute md:top-115 md:-right-0"}`}>
                    <Input
                        name="description"
                        label="Description "
                        type="textarea"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className={`${!isEditMode ? "md:h-45" : "md:w-full md:h-[181px]"}`}
                    />
                </div>
                {!isEditMode && <TermsSection agreed={agreed} onToggle={setAgreed} />}

                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
                    <Button variant="secondary" className="w-full sm:w-auto gap-2 py-3" type="button" onClick={() => navigate(-1)}><X size={16} /> Retour</Button>
                    <Button variant="gradient" type="submit" className="w-full sm:w-auto gap-2 py-3" disabled={!agreed || isInvalid || isPending}>
                        {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</> : <><Check size={16} /> {isEditMode ? 'Enregistrer' : 'Soumettre'}</>}
                    </Button>
                </div>
            </form>
        </FormCard>
    )
}