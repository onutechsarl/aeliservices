import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { Mail, CheckCircle2, Save, X, Pencil } from 'lucide-react';
import { Loading } from '../global/Loading';
import { useInfoUserConnected, useUpdateProfile } from '../../hooks/useUser';


export function ProfileSection({ setIsRole }) {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const { data: userData, isLoading: isLoadingUser } = useInfoUserConnected();
    const user = userData?.data?.user;
    const { mutate: mutateUpdate, isPending: isPendingUpdate, isError: isErrorUpdate, error: errorUpdate, isSuccess: isSuccessUpdate, data: dataUpdate } = useUpdateProfile();


    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        profilePhoto: null
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phone: user.phone || ""
            });
        }
        setIsRole(user?.role)
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            const file = files[0];
            if (file) {
                setFormData(prev => ({ ...prev, profilePhoto: file }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = () => {
        const dataToSend = new FormData();
        dataToSend.append("firstName", formData.firstName);
        dataToSend.append("lastName", formData.lastName);
        dataToSend.append("phone", formData.phone);

        if (formData.profilePhoto) {
            dataToSend.append("profilePhoto", formData.profilePhoto);
        }

        mutateUpdate(dataToSend);
    };

    useEffect(() => {
        if (isSuccessUpdate && dataUpdate?.success) {
            toast.success(dataUpdate.message);
            setIsEditing(false);
        }

        if (isErrorUpdate) {
            const mainMessage = errorUpdate?.message;
            toast.error(mainMessage);

            const backendErrors = errorUpdate?.response?.errors;
            if (Array.isArray(backendErrors)) {
                backendErrors.forEach((err) => {
                    toast.info(err.message);
                });
            }
        }

    }, [isSuccessUpdate, isErrorUpdate, dataUpdate, errorUpdate]);

    if (isLoadingUser) {
        return <Loading className="h-64" size="small" title="Chargement du profil..." />;
    }

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#E8524D] to-[#FCE0D6] p-6 text-white shadow-lg">
                <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="relative">
                        {!isEditing &&
                            <img
                                src={user?.profilePhoto || `./no-user.jpg`}
                                alt="profile"
                                className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-xl mb-2"
                            />
                        }
                        {isEditing && (
                            <Input
                                name="profilePhoto"
                                type="file"
                                onChange={handleChange}
                                accept="image/*"
                                className="w-20 h-20 !rounded-full !overflow-hidden min-h-auto" />
                        )}

                        {user?.isActive && !isEditing && (
                            <div className="absolute top-14 left-14 w-4 h-4 bg-green-400 border-2 border-purple-600 rounded-full"></div>
                        )}
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-xl font-bold">{user?.lastName} {user?.firstName}</h2>
                        <p className="text-purple-100 text-sm mb-4">{user?.email}</p>
                    </div>

                    {!isEditing ? (
                        <Button
                            onClick={() => setIsEditing(true)}
                            variant="secondary"
                            size="sm"
                            className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                        >
                            <span className="flex gap-2 item-center justify-center">
                                <Pencil size={16} />
                                Modifier
                            </span>

                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsEditing(false)}
                                variant="secondary"
                                size="sm"
                                className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                            >
                                <X size={16} className="mr-1" /> Annuler
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isPendingUpdate}
                                variant=""
                                size="sm"
                                className="bg-emerald-500 border-green-600/10"
                            >
                                <Save size={16} className="mr-1" /> {isPendingUpdate ? "..." : "Enregistrer"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Section */}
            <Card className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Input
                        label="Nom"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="!text-slate-500"
                    />
                    <Input
                        label="Prenom"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="!text-slate-500"
                    />

                    <Input
                        label="Genre"
                        type="select"
                        value={user?.gender}
                        disabled={true} // Non éditable selon votre doc API
                        options={[
                            { value: 'female', label: 'Femme' },
                            { value: 'male', label: 'Homme' }
                        ]}
                        className="!text-slate-500"
                    />

                    <Input
                        label="Pays"
                        value={user?.country}
                        disabled={true}
                        className="!text-slate-500"
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={user?.email}
                        disabled={true}
                        className="!text-slate-500"
                    />
                    <Input
                        label="Telephone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="!text-slate-500"
                    />
                </div>

                {/* Status Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mon adresse email</label>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <Mail className="w-5 h-5 text-blue-600" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                                {user?.isEmailVerified && (
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Vérifié
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                        <Badge variant={user?.isActive ? "success" : "neutral"} className="px-3 py-1.5 text-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            {user?.isActive ? "Actif" : "Inactif"}
                        </Badge>
                    </div>
                </div>
            </Card>
        </div>
    );
}
