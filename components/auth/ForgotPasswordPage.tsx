import React, { useState } from 'react';
import { AR_LABELS, MailIcon } from '../../constants';

interface ForgotPasswordPageProps {
    onCodeSent: (email: string) => void;
    onBackToLogin: () => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onCodeSent, onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('الرجاء إدخال بريد إلكتروني صالح.');
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            if (email.toLowerCase() === 'admin@pos.com') {
                onCodeSent(email);
            } else {
                setError(AR_LABELS.emailNotRegistered);
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{AR_LABELS.forgotPassword}</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">أدخل بريدك الإلكتروني لإرسال رمز التحقق.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="sr-only">{AR_LABELS.email}</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <MailIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="w-full pl-3 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-right bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder={AR_LABELS.email}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                
                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-300"
                    >
                        {isLoading ? 'جارِ الإرسال...' : AR_LABELS.sendVerificationCode}
                    </button>
                </div>
                <div className="text-sm text-center">
                    <a href="#" onClick={(e) => { e.preventDefault(); onBackToLogin(); }} className="font-medium text-orange-600 hover:text-orange-500">
                        {AR_LABELS.backToLogin}
                    </a>
                </div>
            </form>
        </div>
    );
};

export default ForgotPasswordPage;
