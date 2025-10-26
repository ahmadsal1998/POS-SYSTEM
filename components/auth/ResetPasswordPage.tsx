import React, { useState } from 'react';
import { AR_LABELS, LockIcon, CheckCircleIcon } from '../../constants';

interface ResetPasswordPageProps {
    onPasswordResetSuccess: () => void;
}

// Icon for error messages, defined locally for this component
const ExclamationCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);


const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onPasswordResetSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password.length < 8) {
            setError(AR_LABELS.passwordTooShort);
            return;
        }

        if (password !== confirmPassword) {
            setError(AR_LABELS.passwordsDoNotMatch);
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            console.log('Password reset successfully.');
            setSuccessMessage(AR_LABELS.passwordUpdatedSuccess);
            setIsLoading(false);
            
            // Redirect to login after a short delay
            setTimeout(() => {
                onPasswordResetSuccess();
            }, 2000);

        }, 1000);
    };

    return (
        <div className="w-full max-w-sm mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">
            <div className="px-6 py-8">
                <div className="flex justify-center mx-auto">
                    <span className="text-3xl font-bold text-orange-500">PoshPointHub</span>
                </div>

                <h3 className="mt-4 text-xl font-medium text-center text-gray-600 dark:text-gray-200">
                    {AR_LABELS.resetPassword}
                </h3>

                <p className="mt-1 text-center text-gray-500 dark:text-gray-400">
                    أدخل كلمة المرور الجديدة القوية.
                </p>

                <form onSubmit={handleSubmit} className="mt-6">
                    <div className="w-full">
                        <label htmlFor="password" className="sr-only">{AR_LABELS.newPassword}</label>
                        <div className="relative flex items-center">
                             <span className="absolute right-0 pr-3">
                                <LockIcon className="w-5 h-5 text-gray-400" />
                            </span>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="block w-full py-3 text-gray-700 bg-white border rounded-lg dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40 text-right pr-10"
                                placeholder={AR_LABELS.newPassword}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="w-full mt-4">
                        <label htmlFor="confirmPassword" className="sr-only">{AR_LABELS.confirmPassword}</label>
                        <div className="relative flex items-center">
                             <span className="absolute right-0 pr-3">
                                <LockIcon className="w-5 h-5 text-gray-400" />
                            </span>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                className="block w-full py-3 text-gray-700 bg-white border rounded-lg dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40 text-right pr-10"
                                placeholder={AR_LABELS.confirmPassword}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 flex items-center justify-end p-3 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                            <span className="font-medium">{error}</span>
                            <ExclamationCircleIcon className="w-5 h-5 mr-2" />
                        </div>
                    )}
                    {successMessage && (
                       <div className="mt-4 flex items-center justify-end p-3 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
                            <span className="font-medium">{successMessage}</span>
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                        </div>
                    )}

                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={isLoading || !!successMessage}
                            className="w-full px-6 py-3 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring focus:ring-orange-300 focus:ring-opacity-50 disabled:bg-orange-400 disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'جارِ التحديث...' : AR_LABELS.updatePassword}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
