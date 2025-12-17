
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, DollarSign, Menu, 
  X, PieChart, Settings, UserPlus, FileText, HelpCircle, 
  LogOut, Search, ChevronRight, User 
} from 'lucide-react';

const BottomNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Fecha o menu sempre que a rota mudar
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const mainNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Início' },
    { to: '/agenda', icon: Calendar, label: 'Agenda' },
    { to: '/patients', icon: Users, label: 'Pacientes' },
    { to: '/financial', icon: DollarSign, label: 'Finanças' },
  ];

  const secondaryNavItems = [
    { to: '/crm', icon: UserPlus, label: 'Comercial (CRM)', desc: 'Gestão de Oportunidades e Funil' },
    { to: '/documents', icon: FileText, label: 'Documentos', desc: 'Contratos e Atestados' },
    { to: '/reports', icon: PieChart, label: 'Relatórios', desc: 'KPIs e Métricas' },
    { to: '/settings', icon: Settings, label: 'Configurações', desc: 'Ajustes do Sistema' },
    { to: '/support', icon: HelpCircle, label: 'Ajuda e Suporte', desc: 'Fale Conosco' },
  ];

  return (
    <>
      {/* --- FULL SCREEN DRAWER (SLIDE UP) --- */}
      <div 
        className={`fixed inset-0 z-[70] bg-white transform transition-transform duration-300 ease-out md:hidden flex flex-col
        ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-white shrink-0 safe-top">
            <div>
                <h2 className="text-xl font-bold text-gray-800">Menu Completo</h2>
                <p className="text-xs text-gray-500">Todas as funcionalidades</p>
            </div>
            <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
            
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="O que você procura?" 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
            </div>

            {/* Grid of Secondary Actions */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 px-1 tracking-wider">Aplicativos</h3>
                <div className="grid grid-cols-1 gap-2">
                    {secondaryNavItems.map((item) => (
                        <button
                            key={item.to}
                            onClick={() => {
                                navigate(item.to);
                                setIsMenuOpen(false);
                            }}
                            className={`flex items-center gap-4 p-4 rounded-xl active:scale-[0.98] transition-all bg-white border border-gray-100 shadow-sm
                            ${location.pathname === item.to ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
                        >
                            <div className={`p-3 rounded-xl shrink-0 ${location.pathname === item.to ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                <item.icon size={22} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className={`text-base font-bold ${location.pathname === item.to ? 'text-blue-700' : 'text-gray-800'}`}>
                                    {item.label}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                            </div>
                            <ChevronRight size={18} className="text-gray-300" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Profile Section */}
            <div className="pb-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 px-1 tracking-wider">Minha Conta</h3>
                <button 
                    onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl mb-3 shadow-sm active:scale-[0.98] transition-transform"
                >
                    <div className="relative">
                        <img src="https://i.pravatar.cc/300?img=11" alt="User" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="text-left flex-1">
                        <p className="text-base font-bold text-gray-900">Dr. Marcelo</p>
                        <p className="text-xs text-gray-500">Ver perfil completo</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                </button>
                
                <button className="w-full flex items-center justify-center gap-2 p-3 text-red-600 font-bold text-sm bg-red-50 rounded-xl border border-red-100 active:bg-red-100 transition-colors">
                    <LogOut size={18} /> Sair do Sistema
                </button>
            </div>
        </div>
      </div>

      {/* --- FIXED BOTTOM BAR --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[50] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)] h-16">
        <ul className="flex justify-between items-center h-full px-2">
          {mainNavItems.map((item) => (
            <li key={item.to} className="flex-1 h-full">
              <NavLink
                to={item.to}
                end={item.to === '/'} // Exact match for home only
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center h-full gap-1 transition-all duration-200 active:scale-90
                  ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`relative p-1 rounded-full ${isActive ? 'bg-blue-50' : ''}`}>
                        <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        {isActive && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>}
                    </div>
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
          
          {/* Menu Trigger Button */}
          <li className="flex-1 h-full">
            <button
              onClick={() => setIsMenuOpen(true)}
              className={`w-full flex flex-col items-center justify-center h-full gap-1 transition-colors active:scale-90
              ${isMenuOpen ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`p-1 rounded-full ${isMenuOpen ? 'bg-blue-50' : ''}`}>
                  <Menu size={24} strokeWidth={isMenuOpen ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default BottomNav;
