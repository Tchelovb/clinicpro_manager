import React, { useState } from 'react';
import { useDocuments, PrintStatus } from '../hooks/useDocuments';
import { FileText, Printer, CheckCircle, Archive, Trash2, Clock, Loader } from 'lucide-react';

const DocumentsCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState<PrintStatus>('PENDING');
    const { documents, isLoading, updateStatus, deleteDocument } = useDocuments(activeTab === 'ARCHIVED' ? undefined : activeTab);

    const handlePrint = (doc: any) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
            <html>
              <head>
                <title>${doc.title}</title>
                <style>body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; }</style>
              </head>
              <body>
                ${doc.content}
                <script>
                  window.onload = function() { 
                      window.print(); 
                  }
                </script>
              </body>
            </html>
          `);
            printWindow.document.close();

            if (doc.print_status === 'PENDING') {
                if (window.confirm("O documento foi enviado para a impressora corretamente? Se sim, moveremos para 'Aguardando Assinatura'.")) {
                    updateStatus({ id: doc.id, status: 'PRINTED' });
                }
            }
        }
    };

    const handleConfirmSignature = (id: string) => {
        if (window.confirm("Confirma que o documento foi assinado pelo paciente?")) {
            updateStatus({ id, status: 'SIGNED' });
        }
    }

    const tabs = [
        { id: 'PENDING', label: 'Fila de Impressão', icon: Printer, color: 'text-red-600', bg: 'bg-red-50' },
        { id: 'PRINTED', label: 'Aguardando Assinatura', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { id: 'SIGNED', label: 'Arquivados', icon: Archive, color: 'text-green-600', bg: 'bg-green-50' }
    ];

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <FileText className="text-blue-600" /> Central de Documentos
                </h1>
                <p className="text-gray-500 mt-2">Gerencie contratos e termos de consentimento (Compliance BOS).</p>
            </div>

            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as PrintStatus)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? `bg-white shadow-md ${tab.color} ring-1 ring-gray-200` : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12"><Loader className="animate-spin text-blue-600" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.length > 0 ? (
                        documents.map((doc: any) => (
                            <div key={doc.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-card border border-gray-200 dark:border-slate-700 flex flex-col hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-full ${activeTab === 'PENDING' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-gray-400 block mb-1">DATA</span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString('pt-BR') : '-'}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1 line-clamp-2">{doc.title}</h3>
                                <p className="text-sm text-blue-600 font-medium mb-4">{doc.patient?.name}</p>

                                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-700 flex gap-2">
                                    <button
                                        onClick={() => handlePrint(doc)}
                                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Printer size={16} /> {activeTab === 'PENDING' ? 'Imprimir' : 'Reimprimir'}
                                    </button>

                                    {activeTab === 'PRINTED' && (
                                        <button
                                            onClick={() => handleConfirmSignature(doc.id)}
                                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <CheckCircle size={16} /> Assinado
                                        </button>
                                    )}

                                    {activeTab === 'PENDING' && (
                                        <button onClick={() => deleteDocument(doc.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Cancelar"><Trash2 size={18} /></button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-16 text-center text-gray-400 bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300">
                            <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg">Nenhum documento nesta etapa.</p>
                            <p className="text-sm opacity-70">Tudo em dia com o compliance!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentsCenter;
