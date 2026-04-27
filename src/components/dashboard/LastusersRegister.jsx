import React from "react";
import {
  MapPin,
  User,
  ShieldCheck,
  Briefcase,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Card } from "../../ui/Card";
import { Table } from "../../ui/Table";
import { Badge } from "../../ui/Badge";
import { useStats } from "../../hooks/useStats";
import { NotFound } from "../global/NotFound";
import { Loader } from "../global/Loader";

/**
 * UI component responsible for rendering the lastusers register section.
 */
export const LastusersRegister = () => {
  const { data: statsResponse, isLoading, isError } = useStats();
  const recentUsers = statsResponse?.data?.recentUsers || [];
  const recentProviders = statsResponse?.data?.recentProviders || [];

  const headers = [
    "Prestataire",
    "Contact",
    "Activités",
    "Localisation",
    "Documents",
    "Statut métier",
    "Statut compte",
  ];
  const headersUser = [
    "Utilisateur",
    "Rôle",
    "Genre",
    "Contact",
    "Localisation",
    "Vérifié",
    "Dernière Connexion",
    "Status",
  ];

  return (
    <div className="f mb-2">
      <div className="flex flex-col gap-6 ">
        <Card>
          <div className="px-2 md:px-6 py-2">
            <h3 className="text-lg font-semibold text-gray-800 ">
              5 derniers utilisateurs inscrit
            </h3>
          </div>
          {isLoading ? (
            <Loader message="Chargement des utilisateurs récents..." />
          ) : isError ? (
            <NotFound
              Icon={AlertCircle}
              title="Erreur de chargement"
              message="Impossible de récupérer les utilisateurs récents."
            />
          ) : recentUsers.length > 0 ? (
            <Table headers={headersUser}>
              {recentUsers.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="pl-6 pr-12 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.profilePhoto ||
                          `https://ui-avatars.com/api/?name=${item.firstName}+${item.lastName}&background=random`
                        }
                        className="h-10 w-10 rounded-full object-cover border border-slate-200"
                        alt="avatar"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 leading-none truncate">
                          {item.firstName} {item.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 italic">
                          ID: {item.id?.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${item.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : item.role === "provider"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {item.role || "user"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs capitalize text-slate-600">
                    <div
                      className={`text-xs capitalize px-2 py-1 rounded-full w-fit truncate ${item.gender === "male"
                        ? "bg-blue-50 text-blue-600"
                        : item.gender === "female"
                          ? "bg-pink-50 text-pink-600"
                          : "bg-slate-50 text-slate-400"
                        }`}
                    >
                      {item.gender || "Non défini"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-600">{item.email}</div>
                    <div className="text-[10px] text-slate-400">
                      {item.phone || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {item.country || "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.isEmailVerified && (
                      <ShieldCheck
                        size={18}
                        className="text-emerald-500 mx-auto"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 text-[11px] text-slate-500">
                    {item.lastLogin
                      ? new Date(item.lastLogin).toLocaleDateString()
                      : "Jamais"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      status={item.isActive ? "Actif" : "Bloqué"}
                      variant={item.isActive ? "green" : "red"}
                    />
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <NotFound
              Icon={User}
              title="Aucun utilisateur récent"
              message="Il semble qu'aucun nouvel utilisateur ne se soit inscrit au cours des derniers jours."
            />
          )}
        </Card>

        <Card>
          <div className="px-2 md:px-6 py-2">
            <h3 className="text-lg font-semibold text-gray-800 ">
              5 derniers prestaires creer
            </h3>
          </div>

          {isLoading ? (
            <Loader message="Chargement des prestataires récents..." />
          ) : isError ? (
            <NotFound
              Icon={AlertCircle}
              title="Erreur de chargement"
              message="Impossible de récupérer les prestataires récents."
            />
          ) : recentProviders.length > 0 ? (
            <Table headers={headers}>
              {recentProviders.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="pl-6 pr-12 py-4">
                    <div className="flex items-start justify-start gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={
                            item.user?.profilePhoto ||
                            `https://ui-avatars.com/api/?name=${item.businessName || "Provider"}&background=random`
                          }
                          className="h-10 w-10 rounded-full object-cover border border-slate-200"
                          alt="avatar"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <Briefcase size={10} className="text-red-500" />
                        </div>
                      </div>
                      <div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 leading-none truncate">
                            {item.businessName || "-"}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 truncate">
                            {item.firstName || ""} {item.lastName || ""}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 italic">
                          ID: {item.id?.slice(0, 8)}
                        </span>
                      </div>

                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-slate-600">
                        {item.phone || "-"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-500">
                        <a
                          href={
                            item.whatsapp
                              ? `https://wa.me/${String(item.whatsapp).replace(/\s/g, "")}`
                              : undefined
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-slate-400 hover:text-blue-500 hover:underline"
                        >
                          {item.whatsapp || "-"}
                        </a>
                      </div>
                    </div>
                  </td>

                  {/* <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                      {item.activities?.slice(0, 2).map((act, idx) => (
                        <span
                          key={idx}
                          className="bg-red-50 text-red-600 text-[9px] font-bold uppercase px-2 py-0.5 rounded"
                        >
                          {act}
                        </span>
                      ))}
                      {item.activities?.length > 2 && (
                        <span className="text-[9px] text-slate-400">
                          +{item.activities.length - 2}
                        </span>
                      )}
                      {!item.activities?.length && (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </div>
                  </td> */}

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin size={12} className="text-red-400" />
                      <span className="truncate max-w-[120px]">
                        {item.location || "-"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {item.documents?.length > 0 ? (
                        item.documents.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc?.url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:z-10 shadow-sm transition-all"
                            title={`Doc: ${doc?.type || "Fichier"}`}
                          >
                            <FileText size={14} />
                          </a>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <Badge
                      status={
                        item.verificationStatus
                      }
                      variant={
                        item.status === "approved" ||
                          item.verificationStatus === "approved"
                          ? "green"
                          : item.verificationStatus === "pending"
                            ? "yellow"
                            : item.verificationStatus === "under_review" // Nouvelle condition ajoutée ici
                              ? "purple"
                              : "red"
                      }
                    />
                  </td>

                  <td className="px-6 py-4">
                    <Badge
                      status={item.isActive ? "Bloqué" : "Actif"}
                      variant={item.isActive ? "red" : "green"}
                    />
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <NotFound
              Icon={User}
              title="Aucun prestataire trouvé"
              message="Aucun nouveau profil de prestataire n'a été créé ou n'est en attente de validation pour le moment."
            />
          )}
        </Card>
      </div>
    </div>
  );
};
