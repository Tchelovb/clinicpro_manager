
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Plus, Edit2, Trash2, Search,
    FilePlus, LayoutTemplate, Printer
} from 'lucide-react';

const Documents: React.FC = () => {
    const {
        documents, templates, deleteTemplate, deleteDocument
    } = useData();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'docs' | 'templates'>('docs');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDocs = documents.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-primary-600 dark:text-primary-400" /> Gestão de Documentos
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Contratos, atestados, receitas e consentimentos.</p>
                </div>

                <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('docs')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'docs' ? 'bg-white dark:bg-slate-700 shadow text-primary-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Meus Documentos</button>
                    <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'templates' ? 'bg-white dark:bg-slate-700 shadow text-primary-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Modelos (Templates)</button>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-card">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={activeTab === 'docs' ? "Buscar por título ou paciente..." : "Buscar modelos..."}
                        className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm shadow-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full lg:w-auto">
                    <button
                        onClick={() => navigate('/documents/blank-sheets')}
                        className="flex-1 lg:flex-none justify-center px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 whitespace-nowrap transition-colors"
                        title="Acessar modelos para impressão manual"
                    >
                        <Printer size={18} /> Fichas em Branco
                    </button>

                    {activeTab === 'docs' ? (
                        <button onClick={() => navigate('/documents/new')} className="flex-1 lg:flex-none justify-center bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-primary-700 whitespace-nowrap shadow-sm"><Plus size={18} /> Novo Documento</button>
                    ) : (
                        <button onClick={() => navigate('/documents/templates/new')} className="flex-1 lg:flex-none justify-center bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-primary-700 whitespace-nowrap shadow-sm"><FilePlus size={18} /> Novo Modelo</button>
                    )}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-card">
                {activeTab === 'docs' && (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Documento</th>
                                        <th className="px-6 py-3 font-medium">Paciente</th>
                                        <th className="px-6 py-3 font-medium">Tipo</th>
                                        <th className="px-6 py-3 font-medium">Data</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {filteredDocs.map(doc => (
                                        <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors" onClick={() => navigate(`/documents/${doc.id}`)}>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{doc.title}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{doc.patientName}</td>
                                            <td className="px-6 py-4"><span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300">{doc.type}</span></td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${doc.status === 'Assinado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : doc.status === 'Rascunho' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{doc.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-primary-600 dark:text-primary-400"><Edit2 size={16} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }} className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-red-500"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredDocs.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Nenhum documento encontrado.</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredDocs.map(doc => (
                                <div key={doc.id} className="p-4 flex flex-col gap-3" onClick={() => navigate(`/documents/${doc.id}`)}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{doc.title}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{doc.patientName} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${doc.status === 'Assinado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : doc.status === 'Rascunho' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{doc.status}</span>
                                    </div>

                                    <div className="flex justify-between items-center mt-1">
                                        <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300">{doc.type}</span>
                                        <div className="flex gap-3">
                                            <button className="text-primary-600 dark:text-primary-400"><Edit2 size={16} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }} className="text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredDocs.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">Nenhum documento encontrado.</div>}
                        </div>
                    </>
                )}

                {activeTab === 'templates' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {filteredTemplates.map(tpl => (
                            <div key={tpl.id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all group relative bg-white dark:bg-slate-800">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => navigate(`/documents/templates/${tpl.id}`)} className="p-1.5 bg-blue-50 dark:bg-primary-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-primary-900/50"><Edit2 size={14} /></button>
                                    <button onClick={() => deleteTemplate(tpl.id)} className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50"><Trash2 size={14} /></button>
                                </div>
                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
                                    <LayoutTemplate size={20} />
                                </div>
                                <h3 className="font-bold text-gray-800 dark:text-white mb-1">{tpl.name}</h3>
                                <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-500 dark:text-gray-300">{tpl.type}</span>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 line-clamp-3 font-mono bg-gray-50 dark:bg-slate-900/50 p-2 rounded">{tpl.content}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documents;
