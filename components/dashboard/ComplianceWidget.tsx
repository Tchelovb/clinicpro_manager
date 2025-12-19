import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../../hooks/useDocuments';
import { AlertTriangle, CheckCircle, FileText, ArrowRight } from 'lucide-react';

const ComplianceWidget: React.FC = () => {
    const { documents, isLoading } = useDocuments('PENDING');
    const navigate = useNavigate();

    // Filtrar apenas documentos críticos pendentes (simulação)
    // No futuro, cruzar com data da cirurgia
    const pendingDocs = documents || [];
    const riskCount = pendingDocs.length;

    if (isLoading) return <div className="h-40 bg-white dark:bg-slate-800 rounded-xl animate-pulse"></div>;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-card border border-gray-200 dark:border-slate-700 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-500" size={20} /> Compliance Jurídico (BOS)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Status de contratos e termos</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${riskCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {riskCount > 0 ? `${riskCount} Pendentes` : '100% Seguro'}
                </div>
            </div>

            <div className="flex-1 space-y-3">
                {riskCount === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-4">
                        <CheckCircle className="text-green-500 mb-2" size={32} />
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Nenhum risco detectado.</p>
                        <p className="text-xs text-gray-400">Todos os documentos foram assinados.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                <div>
                                    <p className="text-sm text-red-800 dark:text-red-300 font-bold">Ação Necessária</p>
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                        {riskCount} paciente(s) com documentos não assinados na fila de impressão.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mt-2">
                            {pendingDocs.slice(0, 3).map((doc: any) => (
                                <div key={doc.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer" onClick={() => navigate('/documents')}>
                                    <span className="truncate max-w-[150px] font-medium text-gray-700 dark:text-gray-300">{doc.patient?.name}</span>
                                    <span className="text-xs text-gray-400">{doc.type === 'CONSENT' ? 'TCLE' : 'Contrato'}</span>
                                </div>
                            ))}
                            {riskCount > 3 && <p className="text-xs text-center text-gray-400">+ {riskCount - 3} outros</p>}
                        </div>
                    </>
                )}
            </div>

            <button onClick={() => navigate('/documents')} className="mt-4 w-full py-2 border border-blue-100 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                Resolver Pendências <ArrowRight size={16} />
            </button>
        </div>
    );
};

export default ComplianceWidget;
