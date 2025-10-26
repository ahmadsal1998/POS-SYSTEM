import React, { useState } from 'react';
import LoginPage from './components/auth/LoginPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import VerificationPage from './components/auth/VerificationPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import MainLayout from './components/MainLayout';

export type AuthView = 'login' | 'forgot' | 'verify' | 'reset';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authView, setAuthView] = useState<AuthView>('login');
    const [emailForRecovery, setEmailForRecovery] = useState('');

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleCodeSent = (email: string) => {
        setEmailForRecovery(email);
        setAuthView('verify');
    };
    
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 font-sans">
                {authView === 'login' && (
                    <LoginPage 
                        onLoginSuccess={handleLoginSuccess} 
                        onForgotPassword={() => setAuthView('forgot')} 
                    />
                )}
                {authView === 'forgot' && (
                    <ForgotPasswordPage 
                        onCodeSent={handleCodeSent}
                        onBackToLogin={() => setAuthView('login')}
                    />
                )}
                {authView === 'verify' && (
                     <VerificationPage
                        email={emailForRecovery}
                        onVerified={() => setAuthView('reset')}
                        onBackToLogin={() => setAuthView('login')}
                    />
                )}
                {authView === 'reset' && (
                    <ResetPasswordPage 
                        onPasswordResetSuccess={() => setAuthView('login')}
                    />
                )}
            </div>
        );
    }

    return <MainLayout />;
};

export default App;
