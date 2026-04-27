import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FileText, Trash2, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import { ModalCard } from '../../ui/ModalCard';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Loading } from '../global/Loading';
import { NotFound } from '../global/Notfound';
import { CountItems } from '../global/CountItems';
import { useGetMyDocuments, useUploadDocument, useDeleteDocument } from '../../hooks/useProvider';
import { useInfoUserConnected } from '../../hooks/useUser';

/**
 * UI component responsible for rendering manage document modal.
 */
export function ManageDocument({ closeManageDocument, openConfirm, setConfirmConfig, closeModal2 }) {
    const scrollRef = useRef(null);
    const { data: userData } = useInfoUserConnected();
    const providerId = userData?.data?.provider?.id;
    const [formData, setFormData] = useState({ documentType: '', documents: '' });
    const [fileInputKey, setFileInputKey] = useState(0);

    const { data: documentsResponse, isLoading, isError } = useGetMyDocuments(providerId);
    const { mutate: uploadDocument, isPending: isPendingUpload, isSuccess: isSuccessUpload, isError: isErrorUpload, data: dataUpload, error: errorUpload, reset: resetUploqd } = useUploadDocument();
    const { mutate: deleteDocument, isPending: isPendingDelete, isSuccess: isSuccessDelete, isError: isErrorDelete, data: dataDelete, error: errorDelete, reset: resetDelete } = useDeleteDocument();

    const documents = useMemo(() => {
        return documentsResponse?.data?.documents || documentsResponse?.data?.data || documentsResponse?.data || [];
    }, [documentsResponse]);

    const isInvalid =
        !formData.documentType ||
        !formData.documents;

    const formattedDocuments = useMemo(() => {
        if (!Array.isArray(documents)) return [];
        return documents.map((doc, index) => {
            const uploadedAt = doc?.uploadedAt ? new Date(doc.uploadedAt) : null;
            return {
                id: doc?.id || doc?._id || index,
                name: doc?.originalFilename || doc?.name || doc?.filename || doc?.originalName || `Document ${index + 1}`,
                type: doc?.type || doc?.documentType || 'Document',
                status: doc?.status || 'pending',
                rejectionReason: doc?.rejectionReason || null,
                url: doc?.url || doc?.fileUrl || doc?.path || null,
                uploadedAt: uploadedAt
                    ? uploadedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                    : null,
            };
        });
    }, [documents]);

    const totalItems = Array.isArray(documents) ? documents.length : 0;

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] || '';
        setFormData((prev) => ({ ...prev, documents: file }));
    };

    const handleDocumentTypeChange = (event) => {
        setFormData((prev) => ({ ...prev, documentType: event.target.value }));
    };

    const handleUpload = () => {
        if (!formData.documents || !providerId) return;
        const payload = new FormData();
        payload.append('documents', formData.documents);
        payload.append('documentType', formData.documentType);
        uploadDocument({ id: providerId, formData: payload });
        setFormData((prev) => ({ ...prev, documents: '' }));
        setFileInputKey((prev) => prev + 1);
    };

    const handleDelete = (docIndex) => {
        if (!providerId) return;
        deleteDocument({ id: providerId, docIndex });
    };

    const handleDeleteClick = (doc, docIndex) => {
        setConfirmConfig({
            onConfirm: () => handleDelete(docIndex),
            isPending: isPendingDelete,
            title: `Supprimer le document "${doc.name}" ?`,
            description: "Cette action est irréversible. Le document sera définitivement supprimé."
        });
        openConfirm();
    };

    useEffect(() => {
        setConfirmConfig((prev) => ({ ...prev, isPending: isPendingDelete }));
    }, [isPendingDelete, setConfirmConfig]);

    useEffect(() => {
        if (isSuccessUpload && dataUpload?.success || isSuccessDelete && dataDelete?.success) {
            toast.success(dataUpload?.message || dataDelete?.message);
            if (isSuccessDelete && dataDelete?.success) {
                closeModal2();
            }
        }

        if (isErrorUpload || isErrorDelete) {
            const mainMessage = errorUpload?.message || errorDelete?.message;
            toast.error(mainMessage);

            const backendErrors = errorUpload?.response?.errors || errorDelete?.response?.errors;
            if (Array.isArray(backendErrors)) {
                backendErrors.forEach((err) => {
                    toast.info(err.message);
                });
            }
        }

        resetUploqd();
        resetDelete();

    }, [isSuccessUpload, isErrorUpload, dataUpload, errorUpload, resetUploqd, isSuccessDelete, isErrorDelete, dataDelete, errorDelete, resetDelete]);

    return (
        <ModalCard
            title={
                <div className="flex items-center gap-2">
                    <FileText className="text-[#E8524D]" size={20} />
                    Mes documents
                </div>
            }
            closeModal={closeManageDocument}
        >
            {isLoading ? (
                <Loading className="h-64" size="small" title="Chargement de vos documents..." />
            ) : isError ? (
                <NotFound
                    Icon={AlertCircle}
                    title="Erreur de chargement"
                    message="Une erreur est survenue lors de la récupération de vos documents."
                    className="h-40"
                />
            ) : (
                <div className="h-full min-h-0">
                    <div className="flex h-full min-h-0">


                        <CountItems count={totalItems} scrollContainerRef={scrollRef} />
                        <div className="flex flex-col flex-1 min-h-0">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">

                                <div className="flex w-full flex-col items-stretch gap-2 sm:items-center sm:gap-3">
                                    <Input
                                        key={`document-input-${fileInputKey}`}
                                        name="document"
                                        label="document"
                                        type="file"
                                        onChange={handleFileChange}
                                        required
                                        className="w-full "
                                        disabled={isPendingUpload || !providerId}
                                    />
                                    <Input
                                        name="documentType"
                                        type="select"
                                        value={formData.documentType}
                                        onChange={handleDocumentTypeChange}
                                        options={[
                                            { value: 'cni', label: 'CNI' },
                                            // { value: 'license', label: 'Licence commerciale' },
                                            // { value: 'tax', label: 'Document fiscal' },
                                            // { value: 'address_proof', label: 'Justificatif de domicile' },
                                        ]}
                                        className="bg-white text-gray-700 border border-gray-200 rounded-xl !font-semibold w-full pl-12 pr-4 py-3"
                                        disabled={isPendingUpload || !providerId}
                                    />
                                    <Button
                                        variant="gradient"
                                        size="sm"
                                        onClick={handleUpload}
                                        disabled={isPendingUpload || isInvalid}
                                        className="gap-2 mb-4 mt-2 w-full py-3"
                                    >

                                        {(isPendingUpload) ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Envoyer...
                                            </span>
                                        ) : (
                                            <span key="loading-state" className="flex items-center gap-2">
                                                <UploadCloud className="w-4 h-4" />
                                                Soumettre
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div
                                ref={scrollRef}
                                className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto no-scrollbar pb-25 md:pb-10"
                            >
                                {formattedDocuments.length > 0 ? (
                                    formattedDocuments.map((doc, index) => (
                                        <div
                                            key={doc.id}
                                            data-index={index}
                                            className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow duration-200"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex gap-4">
                                                    <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                                                        {doc.url ? (
                                                            <img
                                                                src={doc.url}
                                                                alt={doc.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <FileText className="text-[#E8524D]" size={22} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="w-35 md:w-3/4">
                                                            <h3 className="font-bold text-gray-900 text-lg truncate">{doc.name}</h3>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                                            <span className="uppercase text-xs font-semibold text-slate-400">{doc.type}</span>
                                                            {doc.uploadedAt && <span>{doc.uploadedAt}</span>}
                                                        </div>
                                                        {doc.url && (
                                                            <a
                                                                href={doc.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs text-slate-400 underline"
                                                            >
                                                                Voir le document
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'danger' : 'warning'}
                                                >
                                                    {doc.status === 'approved'
                                                        ? 'Approuvé'
                                                        : doc.status === 'rejected'
                                                            ? 'Rejeté'
                                                            : 'Attente'}
                                                </Badge>
                                            </div>

                                            {doc.rejectionReason && (
                                                <div className="bg-red-50 rounded-lg p-3 mb-3 text-red-600 text-sm">
                                                    Motif : {doc.rejectionReason}
                                                </div>
                                            )}

                                            <div className="flex justify-end">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(doc, index)}
                                                    disabled={isPendingDelete}
                                                    className="gap-2"
                                                >
                                                    <Trash2 size={14} />
                                                    Supprimer
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <NotFound
                                        Icon={FileText}
                                        title="Aucun document"
                                        message="Vous n'avez pas encore ajouté de documents."
                                        className="bg-none h-[260px] border-none"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ModalCard>
    );
}
