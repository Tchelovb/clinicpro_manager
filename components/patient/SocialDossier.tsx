// =====================================================
// COMPONENTE: SocialDossier (CRM de Luxo)
// =====================================================

import React from 'react';
import { User, Instagram, Briefcase, Heart, Gift, Camera } from 'lucide-react';
import { Patient } from '../../types'; // Usando tipo global
import { PatientScoreBadge } from './PatientScoreBadge';

interface Props {
    patient: Patient;
}

export const SocialDossier: React.FC<Props> = ({ patient }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header com Gradiente */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <User className="w-32 h-32" />
                </div>

                <div className="relative z-10 flex gap-4 items-start">
                    {/* Avatar (Foto ou Inicial) */}
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center text-3xl font-black shadow-xl overflow-hidden">
                        {patient.photo_profile_url ? (
                            <img src={patient.photo_profile_url} alt={patient.name} className="w-full h-full object-cover" />
                        ) : (
                            <span>{patient.name.charAt(0)}</span>
                        )}

                        {/* Botão de câmera mini se não tiver foto */}
                        {!patient.photo_profile_url && (
                            <div className="absolute bottom-0 right-0 bg-white/30 p-1 rounded-full cursor-pointer hover:bg-white/50">
                                <Camera size={12} />
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold">{patient.name}</h2>
                            {patient.nickname && (
                                <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full font-medium">
                                    "{patient.nickname}"
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2 mt-2">
                            <PatientScoreBadge score={patient.patient_score || 'STANDARD'} size="sm" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid de Informações */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Lifestyle & Profissão */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <User size={14} /> Perfil Social
                    </h3>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm text-pink-500">
                                <Instagram size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-400 font-medium uppercase">Instagram</p>
                                <p className="font-semibold text-gray-800">
                                    {patient.instagram_handle ? (
                                        <a
                                            href={`https://instagram.com/${patient.instagram_handle.replace('@', '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="hover:text-pink-600 transition-colors"
                                        >
                                            {patient.instagram_handle}
                                        </a>
                                    ) : <span className="text-gray-400 font-normal italic">Não informado</span>}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm text-blue-500">
                                <Briefcase size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-400 font-medium uppercase">Profissão</p>
                                <p className="font-semibold text-gray-800">
                                    {patient.occupation || <span className="text-gray-400 font-normal italic">Não informado</span>}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm text-red-500">
                                <Heart size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-400 font-medium uppercase">Estado Civil</p>
                                <p className="font-semibold text-gray-800">
                                    {patient.marital_status === 'MARRIED' ? 'Casado(a)' :
                                        patient.marital_status === 'SINGLE' ? 'Solteiro(a)' :
                                            patient.marital_status || <span className="text-gray-400 font-normal italic">Não informado</span>}
                                </p>
                            </div>
                        </div>

                        {patient.wedding_anniversary && (
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-lg shadow-sm text-purple-500">
                                    <Gift size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 font-medium uppercase">Boda / Aniversário</p>
                                    <p className="font-semibold text-gray-800">
                                        {new Date(patient.wedding_anniversary).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notas VIP & Inteligência */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Gift size={14} /> VIP Notes & Inteligência
                    </h3>

                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 h-full relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                            <CrownIcon />
                        </div>

                        <p className="text-xs font-bold text-purple-600 uppercase mb-2">Preferências Pessoais</p>
                        {patient.vip_notes ? (
                            <p className="text-sm text-purple-900 italic leading-relaxed">
                                "{patient.vip_notes}"
                            </p>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-24 text-center">
                                <p className="text-xs text-purple-400 italic">Sem notas VIP registradas</p>
                                <button className="text-xs text-purple-600 font-bold mt-2 hover:underline">+ Adicionar Nota</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Galeria Rápida (Preview) */}
                <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                        <span>📸 Galeria de Vendas</span>
                        <button className="text-xs text-blue-600 font-bold hover:underline">Ver Todas</button>
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                        <PhotoPlaceholder label="Sorriso" url={patient.photo_smile_url} />
                        <PhotoPlaceholder label="Frontal" url={patient.photo_frontal_url} />
                        <PhotoPlaceholder label="Perfil" url={patient.photo_profile_side_url} />
                        <PhotoPlaceholder label="Lateral" url={patient.photo_profile_side_url} />
                    </div>
                </div>

            </div>
        </div>
    );
};

// Subcomponente de Placeholder
const PhotoPlaceholder = ({ label, url }: { label: string; url?: string }) => (
    <div className="aspect-square bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-colors cursor-pointer group relative">
        {url ? (
            <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
            <>
                <Camera className="text-gray-300 w-6 h-6 mb-1 group-hover:text-blue-500 transition-colors" />
                <span className="text-[10px] text-gray-400 font-medium uppercase">{label}</span>
            </>
        )}
        {!url && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors">
                <span className="text-[10px] text-transparent group-hover:text-gray-600 font-bold bg-white/80 px-2 py-1 rounded shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-all">Add</span>
            </div>
        )}
    </div>
);

const CrownIcon = () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" className="text-purple-600">
        <path d="M12 2L9 9H2L7 14L5 21L12 17L19 21L17 14L22 9H15L12 2Z" />
    </svg>
);
