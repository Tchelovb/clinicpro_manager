
import React from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Clock, X } from 'lucide-react';

const Notifications: React.FC = () => {
  const notifications = [
      { id: 1, type: 'alert', title: 'Orçamento Pendente', message: 'O orçamento de Roberto Santos expira hoje.', time: '10 min atrás' },
      { id: 2, type: 'success', title: 'Pagamento Recebido', message: 'João Pereira realizou o pagamento da parcela 1/4.', time: '1 hora atrás' },
      { id: 3, type: 'info', title: 'Novo Contato', message: 'Ana Silva acabou de se cadastrar via Instagram.', time: '2 horas atrás' },
      { id: 4, type: 'warning', title: 'Estoque Baixo', message: 'O item "Anestésico Lidocaína" atingiu o nível mínimo.', time: 'Ontem' },
      { id: 5, type: 'info', title: 'Backup Realizado', message: 'O backup diário do sistema foi concluído com sucesso.', time: 'Ontem' },
  ];

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notificações</h1>
            <p className="text-gray-500 text-sm">Fique por dentro das atualizações do sistema.</p>
          </div>
          <button className="text-sm text-blue-600 font-medium hover:underline">Marcar todas como lidas</button>
      </div>

      <div className="space-y-3">
          {notifications.map(notif => (
              <div key={notif.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer group relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                      ${notif.type === 'alert' ? 'bg-red-100 text-red-600' : 
                        notif.type === 'success' ? 'bg-green-100 text-green-600' : 
                        notif.type === 'warning' ? 'bg-orange-100 text-orange-600' : 
                        'bg-blue-100 text-blue-600'}`}>
                      {notif.type === 'alert' ? <AlertTriangle size={20} /> : 
                       notif.type === 'success' ? <CheckCircle size={20} /> : 
                       notif.type === 'warning' ? <AlertTriangle size={20} /> : 
                       <Info size={20} />}
                  </div>
                  <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm">{notif.title}</h4>
                      <p className="text-gray-600 text-sm mt-0.5">{notif.message}</p>
                      <span className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Clock size={12} /> {notif.time}
                      </span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                  <button className="absolute top-2 right-2 p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={16} />
                  </button>
              </div>
          ))}
          
          {notifications.length === 0 && (
              <div className="text-center py-12">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <Bell size={24} />
                  </div>
                  <p className="text-gray-500">Você não tem novas notificações.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default Notifications;
