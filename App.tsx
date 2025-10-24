import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ProductManagementPage from './components/ProductManagementPage'; // Import the new unified product page
import AddMultiUnitProductPage from './components/AddMultiUnitProductPage'; // Import the new multi-unit product page
import SalesPage from './components/SalesPage'; // Import the new unified sales page
import POSPage from './components/POSPage'; // Import the new POS page
import WholesalePOSPage from './components/WholesalePOSPage'; // Import the new Wholesale POS page
import RefundsPage from './components/RefundsPage'; // Import the new Refunds page
import PreferencesPage from './components/PreferencesPage'; // Import the new Preferences page
import UserManagementPage from './components/UserManagementPage'; // Import the new User Management page
import PurchasesPage from './components/PurchasesPage'; // Import the new Purchases page
import ExpensesPage from './components/ExpensesPage'; // Import the new Expenses page
import ChequesPage from './components/ChequesPage'; // Import the new Cheques page

export type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [activePath, setActivePath] = useState<string>('/'); // Set initial active path to dashboard
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  const renderContent = () => {
    if (activePath === '/' || activePath === '/dashboard') {
      return <Dashboard />;
    }
    if (activePath === '/products') {
      return <ProductManagementPage setActivePath={setActivePath} />;
    }
    if (activePath === '/products/add-multi-unit') {
      return <AddMultiUnitProductPage setActivePath={setActivePath} />;
    }
    if (activePath === '/purchases') {
      return <PurchasesPage />;
    }
    if (activePath === '/cheques') {
      return <ChequesPage />;
    }
    if (activePath === '/expenses') {
      return <ExpensesPage />;
    }
    if (activePath === '/sales') {
      return <SalesPage setActivePath={setActivePath} />;
    }
    if (activePath === '/refunds') {
      return <RefundsPage />;
    }
    if (activePath === '/preferences') {
      return <PreferencesPage />;
    }
    if (activePath === '/users') {
      return <UserManagementPage />;
    }
    if (activePath === '/pos/1' || activePath === '/pos') {
      return <POSPage />;
    }
     if (activePath === '/pos/2') {
      return <WholesalePOSPage />;
    }
    
    // Fallback for other routes
    return (
      <div className="text-center text-gray-600 dark:text-gray-400 py-20">
        <h2 className="text-xl font-semibold">المحتوى لهذه الصفحة سيذهب هنا.</h2>
        <p className="text-gray-500 dark:text-gray-500">المسار الحالي: {activePath}</p>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar activePath={activePath} setActivePath={setActivePath} />

      {/* Main Content Area */}
      <div className="flex-1 mr-64"> {/* mr-64 for RTL to account for fixed sidebar width */}
        <Header activePath={activePath} setActivePath={setActivePath} theme={theme} setTheme={setTheme} />
        <main className="p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;