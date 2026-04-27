import React, { useState, useEffect } from 'react'
import { toast } from "react-toastify";
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowRight, Filter, ShoppingBag, AlertCircle, ChevronRight } from 'lucide-react'
import { ProviderCard } from '../../ui/ProviderCard';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Loading } from '../global/Loading';
import { NotFound } from '../global/Notfound';
import { Pagination } from '../global/Pagination';
import { useGetCategory } from '../../hooks/useServices';
import { useGetProviderList } from '../../hooks/useProvider';
import { useAddToFavorites } from '../../hooks/useFavorites';

/**
 * UI component responsible for rendering services section.
 */
export function ServicesSection() {
    const navigate = useNavigate();
    const { openContact, openSidebar, filters, setFilters } = useOutletContext();

    const selectedCategoryId = filters?.categoryId || '';
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // Remets une valeur normale ici

    const { data: categoryData } = useGetCategory();
    const categoriesFromApi = categoryData?.data?.categories || [];

    const queryParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: filters?.search,
    };

    // N'ajoute le categoryId que s'il y a une valeur sélectionnée
    if (selectedCategoryId) {
        queryParams.categoryId = selectedCategoryId;
    }

    const { data: providersResponse, isLoading, isError } = useGetProviderList(queryParams);

    const responseData = providersResponse?.data?.data || providersResponse?.data;
    const providers = responseData?.providers || [];
    const pagination = responseData?.pagination;

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategoryId, filters?.search]);


    const categoryOptions = [
        { value: '', label: 'Toutes les catégories' },
        ...categoriesFromApi.map(cat => ({
            value: cat.id,
            label: cat.name
        }))
    ];

    const { mutate: addToFavorites, isSuccess: isSuccessAddFavorite, isError: isErrorAddFavorite, data: dataAddFavorite, error: errorAddFavorite } = useAddToFavorites();

    /**
     * Handles handle favorite click behavior.
     */
    const handleFavoriteClick = (providerId) => {
        addToFavorites({ providerId });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <h2 className="text-2xl  md:text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                    <ShoppingBag className="text-[#E8524D]" size={32} />
                    Services
                </h2>

                <div className="flex relative w-full sm:w-[300px]">
                    <Filter size={18} className="text-[#E8524D] absolute top-4 left-4 z-10" />
                    <Input
                        name="selectCategory"
                        type="select"
                        value={selectedCategoryId}
                        onChange={(e) => {
                            const nextValue = e.target.value;
                            setFilters((prev) => ({
                                ...prev,
                                categoryId: nextValue
                            }));
                        }}
                        options={categoryOptions}
                        className="bg-white text-gray-700 border border-gray-200 rounded-xl !font-semibold w-full pl-12 pr-4 py-3"
                    />
                </div>
            </div>

            {isLoading ? (
                <Loading className="py-10" size="small" title="Chargement des services..." />
            ) : isError ? (
                <NotFound
                    Icon={AlertCircle}
                    title="Erreur de chargement"
                    message="Une erreur est survenue lors de la récupération des services."
                    className="bg-gray-100 h-[300px] flex-1"
                />
            ) : providers && providers.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {providers.map((item) => (
                            <ProviderCard
                                key={item.id}
                                id={item.id}
                                name={item.businessName}
                                description={item.description}
                                location={item.location}
                                rating={item.averageRating}
                                image={item.profilePhoto}
                                isActive={item.isActive}
                                activities={item.activities}
                                createdAt={new Date(item.createdAt).toLocaleDateString('fr-FR')}
                                onContact={openContact}
                                onFavorite={() => handleFavoriteClick(item.id)}
                                actions={[
                                    <Button
                                        variant="consultAction"
                                        size="none"
                                        onClick={() => navigate('/consult-provider', { state: { mode: "consultationCustomers", data: item } })}
                                        className="font-bold"
                                    >
                                        <span className="font-semibold text-[14px]">
                                            Consulter
                                        </span>
                                        <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                ]}
                            />
                        ))}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex justify-center mt-10">
                            <Pagination
                                currentPage={Number(pagination.currentPage)}
                                totalPages={Number(pagination.totalPages)}
                                onPageChange={(page) => {
                                    setCurrentPage(page);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        </div>
                    )}
                </>
            ) : (
                <NotFound
                    Icon={ShoppingBag}
                    title="Aucun service trouvé"
                    message="Aucun service disponible dans cette catégorie."
                    className="bg-gray-100 h-[300px] flex-1"
                />
            )}
        </div>
    );
}
