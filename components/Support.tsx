import React from 'react';
import { Mail, Phone, MessageCircle, FileQuestion, ExternalLink, ChevronRight } from 'lucide-react';

const Support: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Central de Ajuda</h1>
            <p className="text-gray-500 text-sm">Como podemos ajudar você hoje?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Cards */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:border-blue-300 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  <MessageCircle size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Chat Online</h3>
              <p className="text-sm text-gray-500 mb-4">Fale com nossos atendentes em tempo real.</p>
              <span className="text-blue-600 text-sm font-bold">Iniciar Chat</span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:border-green-300 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                  <Phone size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Telefone</h3>
              <p className="text-sm text-gray-500 mb-4">Segunda a Sexta, das 08h às 18h.</p>
              <span className="text-green-600 text-sm font-bold">0800 123 4567</span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:border-purple-300 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                  <Mail size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Email</h3>
              <p className="text-sm text-gray-500 mb-4">Resposta em até 24 horas úteis.</p>
              <span className="text-purple-600 text-sm font-bold">suporte@clinicpro.com</span>
          </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FileQuestion size={20} className="text-gray-400"/> Perguntas Frequentes
              </h3>
          </div>
          <div className="divide-y divide-gray-100">
              {[
                  "Como alterar minha senha de acesso?",
                  "Como cadastrar um novo profissional?",
                  "O sistema parou de emitir boletos, o que fazer?",
                  "Como exportar o relatório financeiro para Excel?",
                  "É possível integrar com o Google Agenda?"
              ].map((faq, index) => (
                  <div key={index} className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors">
                      <span className="text-sm text-gray-700 font-medium">{faq}</span>
                      <ChevronRight size={16} className="text-gray-400" />
                  </div>
              ))}
          </div>
          <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
              <button className="text-blue-600 text-sm font-bold flex items-center justify-center gap-2 hover:underline">
                  Ver Central de Ajuda Completa <ExternalLink size={14} />
              </button>
          </div>
      </div>
    </div>
  );
};

export default Support;
