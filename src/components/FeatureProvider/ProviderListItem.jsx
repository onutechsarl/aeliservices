import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { MapPin, Clock, CheckCircle2, Users, AlertCircle } from "lucide-react";
import { Card } from "../../ui/Card";
import { Pagination } from "../global/Pagination";
import { Loader } from "../global/Loader";
import { NotFound } from "../global/NotFound";
import { useGetProviderList } from "../../hooks/useProvider";

/**
 * Composant UI responsable du rendu de la liste latérale des prestataires.
 * Utilise désormais la pagination côté serveur pour la performance.
 */
export const ProviderListItem = ({ setSelectedProvider }) => {
  const { filters } = useOutletContext();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const ITEMS_PER_PAGE = 5;

  // Appel du hook avec la page courante et les filtres
  const {
    data: apiResponse,
    isLoading,
    isError,
  } = useGetProviderList(currentPage, {
    limit: String(ITEMS_PER_PAGE),
    search: filters?.search,
  });

  // Extraction des données et de la pagination serveur
  const providers = apiResponse?.data?.providers || [];
  const pagination = apiResponse?.data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  // Gestion de la sélection automatique au chargement ou changement de page
  useEffect(() => {
    if (providers.length > 0) {
      // Si on a déjà un ID sélectionné, on vérifie s'il est dans la nouvelle liste
      // Sinon, on prend le premier élément de la nouvelle page
      const currentSelection = selectedId
        ? providers.find((p) => p.id === selectedId)
        : providers[0];

      if (currentSelection) {
        setSelectedId(currentSelection.id);
        setSelectedProvider(currentSelection);
      } else {
        // Optionnel : Sélectionner le premier de la nouvelle page si l'ancien n'est plus visible
        setSelectedId(providers[0].id);
        setSelectedProvider(providers[0]);
      }
    }
  }, [providers, selectedId, setSelectedProvider]);

  // Reset de la page à 1 lors d'une nouvelle recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [filters?.search]);

  if (isLoading) return <Loader variant="centered" message="Chargement..." />;

  return (
    <div className="flex flex-col gap-4">
      {isError ? (
        <NotFound
          Icon={AlertCircle}
          title="Erreur de chargement"
          message="Impossible de récupérer la liste des prestataires."
          className="h-full"
        />
      ) : providers.length > 0 ? (
        <>
          {providers.map((item) => (
            <Card
              key={item.id}
              variant={selectedId === item.id ? "active" : "default"}
              onClick={() => {
                setSelectedId(item.id);
                setSelectedProvider(item);
              }}
              className="cursor-pointer group transition-all hover:translate-x-1"
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={
                      item.profilePhoto ||
                      `https://ui-avatars.com/api/?name=${item.businessName}&background=random`
                    }
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-100"
                    alt={item.businessName}
                  />
                  {item.isVerified && (
                    <CheckCircle2 className="absolute -bottom-1 -right-1 w-4 h-4 text-[#E8524D] bg-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3
                      className={`font-semibold truncate ${selectedId === item.id ? "text-[#E8524D]" : "text-slate-800"
                        }`}
                    >
                      {item.businessName}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {item.location?.split(",")[0] || "N/A"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* 3. Utilisation de la pagination API */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </>
      ) : (
        <NotFound
          Icon={Users}
          title="Aucun prestataire trouvé"
          message="Aucun profil de prestataire ne correspond à vos critères."
        />
      )}
    </div>
  );
};
