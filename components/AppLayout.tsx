import React, { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import CashOpeningModal from "./CashOpeningModal";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { BOSFloatingButton } from "./BOSFloatingButton";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const { currentRegister, financialSettings } = useData();
  const { profile } = useAuth(); // Assuming profile has needed info if accessed directly, but useData handles settings

  // Logic to determine if blocking modal is needed
  // Only blocking if setting is TRUE and no register is OPEN
  // Also only if user is logged in (profile exists)
  const shouldBlock =
    profile &&
    financialSettings?.force_cash_opening &&
    !currentRegister;

  return (
    <div className="flex w-full h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden">

      {/* GLOBAL BLOCKING MODAL FOR CASH OPENING */}
      {shouldBlock && (
        <CashOpeningModal
          onClose={() => { }} // Empty function because it is blocking, cannot close without action
          onSuccess={() => { window.location.reload(); }} // Simple reload to refresh context
          isBlocking={true}
        />
      )}

      {/* SIDEBAR AREA (Desktop Only) - Static Flex Item */}
      <div
        className={`hidden md:flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm z-30 transition-all duration-300 ease-in-out flex-shrink-0
        ${isSidebarCollapsed ? "w-20" : "w-64"}`}
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* WORKSPACE AREA - Takes remaining width */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
        {/* SCROLLABLE CONTENT AREA - The ONLY place with scroll in the entire app */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full scroll-smooth relative">
          <div className="p-4 md:p-8 w-full max-w-7xl mx-auto min-h-full flex flex-col pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>


      {/* FIXED BOTTOM NAV (Mobile Only) - Outside scroll area */}
      <BottomNav />

      {/* BOS FLOATING BUTTON - Global Access */}
      <BOSFloatingButton />
    </div>
  );
};

export default AppLayout;
