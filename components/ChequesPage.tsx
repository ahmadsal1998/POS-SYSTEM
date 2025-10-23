import React, { useState, useMemo, useEffect } from 'react';
import { PurchaseOrder, ChequeDetails, ChequeStatus } from '../types';
import { AR_LABELS, UUID } from '../constants';

// Replicating mock data locally as we can't import from other components
const MOCK_SUPPLIERS_DATA = [
    { id: 'supp-1', name: 'شركة المواد الغذائية المتحدة', phone: '0112345678' },
    { id: 'supp-2', name: 'موردو الإلكترونيات الحديثة', phone: '0128765432' },
    { id: 'supp-3', name: 'شركة المشروبات العالمية', phone: '0134567890' },
];

const createInitialPurchases = (): PurchaseOrder[] => [
    { id: `PO-001`, supplierId: 'supp-1', supplierName: MOCK_SUPPLIERS_DATA[0].name, items: [], subtotal: 4500, tax: 15, discount: 0, totalAmount: 5175, status: 'Completed', purchaseDate: '2024-07-15T10:00:00Z', paymentMethod: 'Bank Transfer' },
    { id: `PO-002`, supplierId: 'supp-2', supplierName: MOCK_SUPPLIERS_DATA[1].name, items: [], subtotal: 42000, tax: 15, discount: 1000, totalAmount: 47150, status: 'Pending', purchaseDate: '2024-07-20T14:30:00Z', paymentMethod: 'Credit' },
    { id: `PO-003`, supplierId: 'supp-3', supplierName: MOCK_SUPPLIERS_DATA[2].name, items: [], subtotal: 2400, tax: 15, discount: 0, totalAmount: 2760, status: 'Pending', purchaseDate: new Date(Date.now() - 5 * 24*60*60*1000).toISOString(), paymentMethod: 'Cheque', chequeDetails: { chequeAmount: 2760, chequeDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), chequeNumber: '10025', bankName: 'بنك الراجحي', status: 'Pending' } },
    { id: `PO-004`, supplierId: 'supp-1', supplierName: MOCK_SUPPLIERS_DATA[0].name, items: [], subtotal: 8000, tax: 15, discount: 200, totalAmount: 9000, status: 'Completed', purchaseDate: new Date(Date.now() - 10 * 24*60*60*1000).toISOString(), paymentMethod: 'Cheque', chequeDetails: { chequeAmount: 9000, chequeDueDate: new Date().toISOString(), chequeNumber: '10026', bankName: 'بنك الأهلي', status: 'Cleared' } },
    { id: `PO-005`, supplierId: 'supp-2', supplierName: MOCK_SUPPLIERS_DATA[1].name, items: [], subtotal: 1500, tax: 15, discount: 0, totalAmount: 1725, status: 'Pending', purchaseDate: new Date(Date.now() - 20 * 24*60*60*1000).toISOString(), paymentMethod: 'Cheque', chequeDetails: { chequeAmount: 1725, chequeDueDate: new Date(Date.now() - 2 * 24*60*60*1000).toISOString(), chequeNumber: '10027', bankName: 'بنك الرياض', status: 'Bounced' } },
];
// --- END MOCK DATA ---

interface Cheque extends ChequeDetails {
  id: string;
  purchaseId: string;
  supplierName: string;
}

const CHEQUE_STATUS_STYLES: Record<ChequeStatus, { bg: string, text: string, label: string }> = {
    'Pending': { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300', label: AR_LABELS.pending },
    'Cleared': { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300', label: AR_LABELS.cleared },
    'Bounced': { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300', label: AR_LABELS.bounced },
};

const ChequeDetailsModal: React.FC<{
    cheque: Cheque | null;
    onClose: () => void;
    onStatusChange: (chequeId: string, newStatus: ChequeStatus) => void;
}> = ({ cheque, onClose, onStatusChange }) => {
    if (!cheque) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md text-right" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{AR_LABELS.chequeDetails}</h2>
                <div className="space-y-2 text-sm">
                    <p><strong>{AR_LABELS.chequeNumber}:</strong> {cheque.chequeNumber || 'N/A'}</p>
                    <p><strong>{AR_LABELS.supplier}:</strong> {cheque.supplierName}</p>
                    <p><strong>{AR_LABELS.amount}:</strong> <span className="font-bold text-lg text-orange-600">{cheque.chequeAmount.toLocaleString('ar-SA', {style: 'currency', currency: 'SAR'})}</span></p>
                    <p><strong>{AR_LABELS.bankName}:</strong> {cheque.bankName || 'N/A'}</p>
                    <p><strong>{AR_LABELS.chequeDueDate}:</strong> {new Date(cheque.chequeDueDate).toLocaleDateString('ar-SA')}</p>
                    <p><strong>{AR_LABELS.status}:</strong> <span className={`px-2 py-1 text-xs font-semibold rounded-full ${CHEQUE_STATUS_STYLES[cheque.status].bg} ${CHEQUE_STATUS_STYLES[cheque.status].text}`}>{CHEQUE_STATUS_STYLES[cheque.status].label}</span></p>
                </div>
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{AR_LABELS.changeStatus}</label>
                    <div className="flex justify-end gap-2">
                        {Object.keys(CHEQUE_STATUS_STYLES).map(status => (
                            <button key={status} onClick={() => onStatusChange(cheque.id, status as ChequeStatus)} className={`px-3 py-1 text-sm rounded-md ${CHEQUE_STATUS_STYLES[status as ChequeStatus].bg} ${CHEQUE_STATUS_STYLES[status as ChequeStatus].text}`}>{CHEQUE_STATUS_STYLES[status as ChequeStatus].label}</button>
                        ))}
                    </div>
                </div>
                <button onClick={onClose} className="mt-6 w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">{AR_LABELS.cancel}</button>
            </div>
        </div>
    );
};


const ChequesPage: React.FC = () => {
    const [cheques, setCheques] = useState<Cheque[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [modalCheque, setModalCheque] = useState<Cheque | null>(null);

    useEffect(() => {
        const allCheques = createInitialPurchases()
            .filter(p => p.paymentMethod === 'Cheque' && p.chequeDetails)
            .map(p => ({
                ...p.chequeDetails!,
                id: p.id,
                purchaseId: p.id,
                supplierName: p.supplierName,
            }));
        setCheques(allCheques);
    }, []);

    const handleStatusChange = (chequeId: string, newStatus: ChequeStatus) => {
        setCheques(prev => prev.map(c => c.id === chequeId ? { ...c, status: newStatus } : c));
        setModalCheque(null);
    };

    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => null);
        const calendarGrid = [...paddingDays, ...days];
        
        const chequesByDate: Record<number, Cheque[]> = {};
        cheques.forEach(cheque => {
            const dueDate = new Date(cheque.chequeDueDate);
            if (dueDate.getFullYear() === year && dueDate.getMonth() === month) {
                const day = dueDate.getDate();
                if (!chequesByDate[day]) chequesByDate[day] = [];
                chequesByDate[day].push(cheque);
            }
        });

        return { calendarGrid, chequesByDate };
    }, [currentDate, cheques]);

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const today = new Date();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{AR_LABELS.chequeManagement}</h1>
                <p className="text-gray-600 dark:text-gray-400">{AR_LABELS.chequeManagementDescription}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">{"<"}</button>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        {currentDate.toLocaleString('ar-SA', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">{">"}</button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 pb-2 mb-1">
                    {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => <div key={day}>{day}</div>)}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                    {calendarData.calendarGrid.map((day, index) => (
                        <div key={index} className={`h-28 border border-gray-100 dark:border-gray-700/50 rounded-md p-1 overflow-hidden ${!day ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                            {day && (
                                <>
                                    <span className={`text-xs font-semibold ${
                                        today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()
                                        ? 'bg-orange-500 text-white rounded-full px-1.5 py-0.5' : 'text-gray-700 dark:text-gray-300'
                                    }`}>{day}</span>
                                    <div className="mt-1 space-y-1 overflow-y-auto max-h-20">
                                        {calendarData.chequesByDate[day]?.map(cheque => (
                                            <div key={cheque.id} onClick={() => setModalCheque(cheque)} className={`p-1 rounded text-xs cursor-pointer ${CHEQUE_STATUS_STYLES[cheque.status].bg} ${CHEQUE_STATUS_STYLES[cheque.status].text}`}>
                                                <p className="font-bold truncate">{cheque.supplierName}</p>
                                                <p className="font-mono">{cheque.chequeAmount.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <ChequeDetailsModal cheque={modalCheque} onClose={() => setModalCheque(null)} onStatusChange={handleStatusChange} />
        </div>
    );
};

export default ChequesPage;
