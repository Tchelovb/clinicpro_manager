
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { 
  FileText, ArrowLeft, Search, Printer, Download, 
  Smile, Stethoscope, FilePlus, Pill, CheckCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const BlankSheets: React.FC = () => {
  const navigate = useNavigate();
  const { clinicConfig } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(''), 3000);
  };

  // --- PDF GENERATORS (Unchanged logic) ---
  const generateBudgetPDF = (type: 'dental' | 'harmonization') => {
    // ... same pdf logic ...
    const doc = new jsPDF();
    const title = type === 'dental' ? 'ORÇAMENTO ODONTOLÓGICO' : 'ORÇAMENTO - HARMONIZAÇÃO OROFACIAL';
    const primaryColor: [number, number, number] = type === 'dental' ? [30, 58, 138] : [124, 58, 237]; 
    doc.setFillColor(...primaryColor); 
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text('ClinicPro', 20, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(clinicConfig.name, 190, 12, { align: 'right' });
    doc.text(`${clinicConfig.address}`, 190, 17, { align: 'right' });
    doc.text(`Tel: ${clinicConfig.phone}`, 190, 22, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 105, 45, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    let y = 60;
    doc.text('Paciente: ___________________________________________________________________', 20, y);
    doc.text('Data: _____/_____/_______', 160, y);
    y += 10;
    doc.text('CPF: _____________________________   Telefone: ______________________________', 20, y);
    y += 10;
    doc.text('Convênio: ________________________   Plano: ________________________________', 20, y);
    const tableColumn = ["Procedimento", "Região / Dente", "Qtd", "Valor Unit.", "Total"];
    const tableRows = Array(15).fill(["", "", "", "", ""]);
    autoTable(doc, {
        startY: y + 10,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        styles: { minCellHeight: 10, fontSize: 10, cellPadding: 2, valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1 },
        columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40 }, 2: { cellWidth: 15 }, 3: { cellWidth: 25 }, 4: { cellWidth: 25 } }
    });
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setDrawColor(150);
    doc.roundedRect(20, finalY, 170, 30, 2, 2);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text('Observações e Condições de Pagamento:', 25, finalY + 5);
    doc.line(25, finalY + 12, 185, finalY + 12);
    doc.line(25, finalY + 19, 185, finalY + 19);
    doc.line(25, finalY + 26, 185, finalY + 26);
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.line(30, pageHeight - 35, 90, pageHeight - 35);
    doc.text('Assinatura do Paciente', 60, pageHeight - 30, { align: 'center' });
    doc.line(120, pageHeight - 35, 180, pageHeight - 35);
    doc.text('Profissional Responsável', 150, pageHeight - 30, { align: 'center' });
    doc.save(`Ficha_${type}_${new Date().toISOString().slice(0,10)}.pdf`);
    showToast('Orçamento gerado com sucesso!');
  };

  const generateAnamnesisPDF = () => {
    // ... same pdf logic ...
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('FICHA DE ANAMNESE', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(clinicConfig.name, 105, 26, { align: 'center' });
    let y = 40;
    const questions = [
        "Nome Completo:",
        "Data de Nascimento:       /       /           Idade: _______",
        "Endereço:",
        "Telefone: (      ) ___________________   Profissão: ________________________",
        "Queixa Principal:",
        "",
        "HISTÓRICO MÉDICO:",
        "(  ) Hipertensão    (  ) Diabetes    (  ) Cardiopatia    (  ) Asma",
        "(  ) Alergias: _________________________________________________________",
        "(  ) Uso de Medicamentos: ______________________________________________",
        "(  ) Fumante    (  ) Gestante    (  ) Tratamento Médico Atual",
        "",
        "HISTÓRICO ODONTOLÓGICO:",
        "Última visita ao dentista: ________________________________________________",
        "Sensibilidade dentária? (  ) Sim (  ) Não",
        "Sangramento gengival? (  ) Sim (  ) Não",
        "",
        "OBSERVAÇÕES CLÍNICAS (Preenchimento Profissional):"
    ];
    questions.forEach(q => {
        if (q === "") { y += 5; } else if (q.includes("HISTÓRICO") || q.includes("OBSERVAÇÕES")) {
            doc.setFont("helvetica", "bold");
            doc.text(q, 20, y);
            doc.setFont("helvetica", "normal");
            y += 8;
        } else {
            doc.text(q, 20, y);
            if (!q.includes("___") && !q.includes("(  )")) { doc.line(20, y + 2, 190, y + 2); } else if (q.endsWith(":")) { doc.line(doc.getTextWidth(q) + 22, y, 190, y); }
            y += 10;
        }
    });
    for(let i=0; i<8; i++) { doc.line(20, y, 190, y); y += 8; }
    const pageHeight = doc.internal.pageSize.height;
    doc.line(30, pageHeight - 30, 90, pageHeight - 30);
    doc.text('Paciente', 60, pageHeight - 25, { align: 'center' });
    doc.line(120, pageHeight - 30, 180, pageHeight - 30);
    doc.text('Profissional', 150, pageHeight - 25, { align: 'center' });
    doc.save(`Anamnese_Branco_${new Date().toISOString().slice(0,10)}.pdf`);
    showToast('Ficha de anamnese gerada!');
  };

  const generatePrescriptionPDF = () => {
      // ... same pdf logic ...
      const doc = new jsPDF();
      doc.setFillColor(245, 245, 245);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setFontSize(20);
      doc.setTextColor(50);
      doc.text(clinicConfig.name, 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text('RECEITUÁRIO', 105, 30, { align: 'center' });
      let y = 60;
      doc.setFontSize(12);
      doc.text('Paciente: _______________________________________________________', 20, y);
      y += 10;
      doc.text('Uso: (  ) Interno   (  ) Externo', 20, y);
      y += 20;
      for(let i=0; i<15; i++) { doc.setDrawColor(200); doc.line(20, y, 190, y); y += 10; }
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(clinicConfig.address, 105, pageHeight - 20, { align: 'center' });
      doc.text(`Tel: ${clinicConfig.phone} | ${clinicConfig.email}`, 105, pageHeight - 15, { align: 'center' });
      doc.save(`Receituario_${new Date().toISOString().slice(0,10)}.pdf`);
      showToast('Receituário gerado!');
  };

  const templates = [
      { 
          id: 'budget-dental', 
          title: 'Orçamento Odontológico', 
          desc: 'Tabela padrão para procedimentos gerais com odontograma simplificado em texto.',
          icon: Smile,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          action: () => generateBudgetPDF('dental')
      },
      { 
          id: 'budget-hof', 
          title: 'Orçamento Harmonização', 
          desc: 'Layout adaptado para procedimentos estéticos e HOF.',
          icon: Stethoscope,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          action: () => generateBudgetPDF('harmonization')
      },
      { 
          id: 'anamnese', 
          title: 'Ficha de Anamnese', 
          desc: 'Questionário de saúde completo para novos pacientes.',
          icon: FileText,
          color: 'text-green-600',
          bg: 'bg-green-50',
          action: generateAnamnesisPDF
      },
      { 
          id: 'prescription', 
          title: 'Receituário em Branco', 
          desc: 'Folha timbrada com linhas pautadas para prescrição manual.',
          icon: Pill,
          color: 'text-red-600',
          bg: 'bg-red-50',
          action: generatePrescriptionPDF
      },
      { 
          id: 'tcle-generic', 
          title: 'Termo de Consentimento (TCLE)', 
          desc: 'Estrutura padrão para preenchimento dos riscos e benefícios.',
          icon: FilePlus,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          action: () => showToast('Modelo de TCLE genérico em desenvolvimento.')
      }
  ];

  const filteredTemplates = templates.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-20">
        {toastMessage && (
            <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5">
                <CheckCircle size={18} className="text-green-400"/>
                {toastMessage}
            </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/documents')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Printer className="text-primary-600 dark:text-primary-400" /> Fichas em Branco
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gere PDFs prontos para impressão e preenchimento manual.</p>
                </div>
            </div>
            
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar modelo..." 
                    className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm shadow-input" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
                <div key={template.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-card hover:shadow-lg transition-all group flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${template.bg} dark:bg-slate-700 ${template.color} dark:text-white`}>
                            <template.icon size={28} />
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{template.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1">{template.desc}</p>
                    
                    <button 
                        onClick={template.action}
                        className="w-full py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-primary-50 dark:hover:bg-slate-600 hover:text-primary-600 hover:border-primary-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Download size={18} /> Exportar PDF
                    </button>
                </div>
            ))}
        </div>

        {filteredTemplates.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                <div className="mx-auto w-16 h-16 bg-gray-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Search size={24}/>
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium">Nenhum modelo encontrado</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Tente buscar por outro termo.</p>
            </div>
        )}
    </div>
  );
};

export default BlankSheets;
