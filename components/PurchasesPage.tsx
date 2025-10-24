import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PurchaseOrder, Supplier, PurchaseItem, Product, PurchaseStatus, PurchasePaymentMethod, ChequeDetails, SupplierPayment } from '../types';
import { 
  AR_LABELS, UUID, SearchIcon, PlusIcon, EditIcon, DeleteIcon, ViewIcon, CancelIcon, AddPaymentIcon
} from '../constants';

// --- MOCK DATA ---
const MOCK_SUPPLIERS_DATA: Supplier[] = [
    { id: 'supp-1', name: 'شركة المواد الغذائية المتحدة', contactPerson: 'أحمد خالد', phone: '0112345678', address: 'الرياض, المنطقة الصناعية', notes: 'مورد رئيسي للمواد الجافة', previousBalance: 15000 },
    { id: 'supp-2', name: 'موردو الإلكترونيات الحديثة', contactPerson: 'سارة عبدالله', phone: '0128765432', address: 'جدة, حي الشاطئ', notes: '', previousBalance: 0 },
    { id: 'supp-3', name: 'شركة المشروبات العالمية', contactPerson: 'محمد علي', phone: '0134567890', address: 'الدمام, ميناء الملك عبدالعزيز', notes: 'الدفع عند الاستلام فقط', previousBalance: 5250.50 },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'لابتوب Dell XPS 15', category: 'إلكترونيات', price: 4500, stock: 50, barcode: 'DELL-XPS15-12345', expiryDate: '2025-12-31', createdAt: '2023-01-15' },
  { id: 2, name: 'هاتف Samsung S23', category: 'إلكترونيات', price: 2800, stock: 120, barcode: 'SAM-S23-67890', expiryDate: '2026-06-30', createdAt: new Date().toISOString() },
  { id: 3, name: 'كوكا كولا', category: 'مشروبات', price: 2.50, stock: 200, barcode: 'COKE-CAN-123', expiryDate: '2024-12-01', createdAt: '2023-12-01' },
  { id: 4, name: 'أرز بسمتي (10 كجم)', category: 'مواد غذائية', price: 50, stock: 80, barcode: 'RICE-BAS-10KG', expiryDate: '2025-06-01', createdAt: '2023-10-01' },
];

const createInitialPurchases = (): PurchaseOrder[] => [
    {
        id: `PO-001`,
        supplierId: MOCK_SUPPLIERS_DATA[0].id,
        supplierName: MOCK_SUPPLIERS_DATA[0].name,
        items: [
            { productId: 4, productName: 'أرز بسمتي (10 كجم)', unit: 'كيس', quantity: 100, cost: 45, total: 4500 },
        ],
        subtotal: 4500, tax: 15, discount: 0, totalAmount: 5175,
        status: 'Completed',
        purchaseDate: '2024-07-15T10:00:00Z',
        paymentMethod: 'Bank Transfer',
    },
    {
        id: `PO-002`,
        supplierId: MOCK_SUPPLIERS_DATA[1].id,
        supplierName: MOCK_SUPPLIERS_DATA[1].name,
        items: [
            { productId: 1, productName: 'لابتوب Dell XPS 15', unit: 'قطعة', quantity: 10, cost: 4200, total: 42000 },
        ],
        subtotal: 42000, tax: 15, discount: 1000, totalAmount: 47150,
        status: 'Pending',
        purchaseDate: '2024-07-20T14:30:00Z',
        paymentMethod: 'Credit',
    },
     {
        id: `PO-003`,
        supplierId: MOCK_SUPPLIERS_DATA[2].id,
        supplierName: MOCK_SUPPLIERS_DATA[2].name,
        items: [ { productId: 3, productName: 'كوكا كولا', unit: 'كرتون', quantity: 50, cost: 48, total: 2400 } ],
        subtotal: 2400, tax: 15, discount: 0, totalAmount: 2760,
        status: 'Pending',
        purchaseDate: new Date().toISOString(),
        paymentMethod: 'Cheque',
        chequeDetails: { chequeAmount: 2760, chequeDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), chequeNumber: '10025', bankName: 'بنك الراجحي', status: 'Pending' }
    },
];

const MOCK_PAYMENTS_DATA: SupplierPayment[] = [
    { id: UUID(), supplierId: MOCK_SUPPLIERS_DATA[0].id, purchaseId: 'PO-001', amount: 5175, method: 'Bank Transfer', date: '2024-07-16T09:00:00Z' },
    { id: UUID(), supplierId: MOCK_SUPPLIERS_DATA[2].id, amount: 2000, method: 'Cash', date: '2024-07-18T12:00:00Z', notes: 'دفعة تحت الحساب' },
];

const STATUS_STYLES: Record<PurchaseStatus, string> = {
    'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};
const STATUS_LABELS: Record<PurchaseStatus, string> = {
    'Pending': AR_LABELS.pending,
    'Completed': AR_LABELS.completed,
    'Cancelled': AR_LABELS.cancelled,
};
const PAYMENT_METHOD_LABELS: Record<PurchasePaymentMethod, string> = {
    'Cash': AR_LABELS.cash,
    'Bank Transfer': AR_LABELS.bankTransfer,
    'Credit': AR_LABELS.credit,
    'Cheque': AR_LABELS.cheque,
};

const EMPTY_PURCHASE_ORDER: Omit<PurchaseOrder, 'id'> = {
    supplierId: '',
    supplierName: '',
    items: [],
    subtotal: 0,
    tax: 15, // Default VAT
    discount: 0,
    totalAmount: 0,
    status: 'Pending',
    purchaseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: '',
};

type PaymentTarget = {
    supplier: Supplier;
    purchaseId?: string; 
    defaultAmount: number;
} | null;

// --- MODAL COMPONENTS ---

const SupplierFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (newSupplier: Supplier) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        if (!name.trim()) {
            alert('اسم المورد مطلوب.');
            return;
        }
        onSave({
            id: UUID(),
            name, 
            contactPerson,
            phone,
            email,
            address, 
            notes,
            previousBalance: 0,
        });
        setName('');
        setContactPerson('');
        setPhone('');
        setEmail('');
        setAddress('');
        setNotes('');
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md text-right" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{AR_LABELS.addNewSupplier}</h2>
                <div className="space-y-4">
                    <input type="text" placeholder={AR_LABELS.supplier} value={name} onChange={e => setName(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"/>
                    <input type="text" placeholder={AR_LABELS.contactPerson} value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"/>
                    <input type="text" placeholder={AR_LABELS.phone} value={phone} onChange={e => setPhone(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"/>
                    <input type="email" placeholder={AR_LABELS.email} value={email} onChange={e => setEmail(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"/>
                    <textarea placeholder={AR_LABELS.address} value={address} onChange={e => setAddress(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"/>
                    <textarea placeholder="ملاحظات" value={notes} onChange={e => setNotes(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"/>
                </div>
                 <div className="flex justify-start space-x-4 space-x-reverse pt-4">
                    <button onClick={handleSave} className="px-4 py-2 bg-orange-500 text-white rounded-md">{AR_LABELS.save}</button>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md">{AR_LABELS.cancel}</button>
                </div>
            </div>
        </div>
    )
}

const PurchaseFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (purchase: PurchaseOrder) => void;
  purchaseToEdit: PurchaseOrder | null;
  suppliers: Supplier[];
  onAddNewSupplier: () => void;
}> = ({ isOpen, onClose, onSave, purchaseToEdit, suppliers, onAddNewSupplier }) => {
    const [formData, setFormData] = useState<Omit<PurchaseOrder, 'id'>>(EMPTY_PURCHASE_ORDER);
    const [productSearch, setProductSearch] = useState('');

    useEffect(() => {
        const initialData = purchaseToEdit ? { ...purchaseToEdit } : { ...EMPTY_PURCHASE_ORDER };
        if (initialData.paymentMethod === 'Cheque' && !initialData.chequeDetails) {
            initialData.chequeDetails = { chequeAmount: 0, chequeDueDate: '', status: 'Pending' };
        }
        setFormData(initialData);
    }, [purchaseToEdit, isOpen]);

    useEffect(() => {
        const subtotal = formData.items.reduce((acc, item) => acc + item.total, 0);
        const totalAfterDiscount = subtotal - formData.discount;
        const taxAmount = totalAfterDiscount * (formData.tax / 100);
        const totalAmount = totalAfterDiscount + taxAmount;
        setFormData(prev => ({
            ...prev,
            subtotal,
            totalAmount,
            chequeDetails: prev.paymentMethod === 'Cheque' ? { ...prev.chequeDetails, chequeAmount: totalAmount, chequeDueDate: prev.chequeDetails?.chequeDueDate || '', status: prev.chequeDetails?.status || 'Pending' } : undefined
        }));
    }, [formData.items, formData.discount, formData.tax, formData.paymentMethod]);

    const handleAddItem = (product: Product) => {
        const newItem: PurchaseItem = { productId: product.id, productName: product.name, unit: 'قطعة', quantity: 1, cost: product.price, total: product.price };
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
        setProductSearch('');
    };

    const handleItemChange = (productId: number, field: 'quantity' | 'cost' | 'unit', value: string | number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.productId === productId) {
                    const updatedItem = { ...item, [field]: value };
                    if (field === 'quantity' || field === 'cost') {
                        updatedItem.total = updatedItem.quantity * updatedItem.cost;
                    }
                    return updatedItem;
                }
                return item;
            })
        }));
    };

    const handleRemoveItem = (productId: number) => { setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.productId !== productId) })); };

    const handleSupplierChange = (supplierId: string) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (supplier) { setFormData(prev => ({...prev, supplierId: supplier.id, supplierName: supplier.name})); }
    };

    const handleChequeDetailChange = (field: keyof ChequeDetails, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            chequeDetails: {
                chequeAmount: prev.chequeDetails?.chequeAmount || 0,
                chequeDueDate: prev.chequeDetails?.chequeDueDate || '',
                status: prev.chequeDetails?.status || 'Pending',
                ...prev.chequeDetails,
                [field]: value
            }
        }))
    }

    const handleSubmit = () => {
        if (!formData.supplierId || formData.items.length === 0) { alert("يرجى اختيار مورد وإضافة منتجات."); return; }
        if (formData.paymentMethod === 'Cheque' && !formData.chequeDetails?.chequeDueDate) { alert("تاريخ استحقاق الشيك مطلوب."); return; }
        onSave({ id: purchaseToEdit?.id || `PO-${UUID()}`, ...formData });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl text-right" onClick={e => e.stopPropagation()}>
                <div className="max-h-[85vh] overflow-y-auto pr-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{purchaseToEdit ? AR_LABELS.edit : AR_LABELS.addNewPurchase}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                             <select value={formData.supplierId} onChange={(e) => handleSupplierChange(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm">
                                <option value="" disabled>{AR_LABELS.selectSupplier}</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <button onClick={onAddNewSupplier} className="p-2 bg-orange-500 text-white rounded-md"><PlusIcon className="h-4 w-4"/></button>
                        </div>
                        <input type="date" value={formData.purchaseDate.toString().split('T')[0]} onChange={e => setFormData(f=>({...f, purchaseDate: e.target.value}))} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"/>
                        <select value={formData.paymentMethod} onChange={e => setFormData(f=>({...f, paymentMethod: e.target.value as PurchasePaymentMethod}))} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm">
                            {Object.keys(PAYMENT_METHOD_LABELS).map(key => <option key={key} value={key}>{PAYMENT_METHOD_LABELS[key as PurchasePaymentMethod]}</option>)}
                        </select>
                    </div>

                    {formData.paymentMethod === 'Cheque' && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-400 rounded-md grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" placeholder={AR_LABELS.chequeNumber} value={formData.chequeDetails?.chequeNumber || ''} onChange={e => handleChequeDetailChange('chequeNumber', e.target.value)} className="w-full border-gray-300 dark:border-gray-600 rounded-md"/>
                            <input type="number" placeholder={AR_LABELS.chequeAmount} value={formData.chequeDetails?.chequeAmount || 0} onChange={e => handleChequeDetailChange('chequeAmount', parseFloat(e.target.value))} className="w-full border-gray-300 dark:border-gray-600 rounded-md"/>
                            <input type="date" placeholder={AR_LABELS.chequeDueDate} value={formData.chequeDetails?.chequeDueDate.split('T')[0] || ''} onChange={e => handleChequeDetailChange('chequeDueDate', e.target.value)} className="w-full border-gray-300 dark:border-gray-600 rounded-md"/>
                            <input type="text" placeholder={AR_LABELS.bankName} value={formData.chequeDetails?.bankName || ''} onChange={e => handleChequeDetailChange('bankName', e.target.value)} className="w-full border-gray-300 dark:border-gray-600 rounded-md"/>
                            <textarea placeholder={AR_LABELS.chequeNotes} value={formData.chequeDetails?.notes || ''} onChange={e => handleChequeDetailChange('notes', e.target.value)} className="md:col-span-2 w-full border-gray-300 dark:border-gray-600 rounded-md"/>
                        </div>
                    )}
                    
                    <div className="relative">
                        <input type="text" placeholder="ابحث عن منتج لإضافته..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"/>
                        {productSearch && (
                            <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">{MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (<div key={p.id} onClick={() => handleAddItem(p)} className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/50 cursor-pointer">{p.name}</div>))}</div>
                        )}
                    </div>
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
                        <table className="min-w-full"><thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="p-2 text-xs">{AR_LABELS.productName}</th><th className="p-2 text-xs">{AR_LABELS.unit}</th><th className="p-2 text-xs">{AR_LABELS.quantity}</th><th className="p-2 text-xs">{AR_LABELS.unitCost}</th><th className="p-2 text-xs">{AR_LABELS.totalAmount}</th><th></th></tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{formData.items.map(item => (<tr key={item.productId}><td className="p-2 text-sm">{item.productName}</td><td className="p-1"><input type="text" value={item.unit} onChange={e => handleItemChange(item.productId, 'unit', e.target.value)} className="w-20 p-1 border rounded-md"/></td><td className="p-1"><input type="number" value={item.quantity} onChange={e => handleItemChange(item.productId, 'quantity', parseFloat(e.target.value))} className="w-20 p-1 border rounded"/></td><td className="p-1"><input type="number" value={item.cost} onChange={e => handleItemChange(item.productId, 'cost', parseFloat(e.target.value))} className="w-24 p-1 border rounded"/></td><td className="p-2 text-sm font-semibold">{item.total.toFixed(2)}</td><td className="p-1"><button onClick={() => handleRemoveItem(item.productId)} className="text-red-500"><DeleteIcon/></button></td></tr>))}</tbody></table>
                    </div>
                    <div className="flex justify-between items-end"><div className="w-1/2"><textarea placeholder="ملاحظات..." value={formData.notes} onChange={e => setFormData(f=>({...f, notes: e.target.value}))} className="w-full h-24 border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/></div>
                        <div className="w-1/3 space-y-1 text-sm"><div className="flex justify-between"><span>{AR_LABELS.subtotal}:</span><span>{formData.subtotal.toFixed(2)}</span></div><div className="flex justify-between items-center"><label>{AR_LABELS.discount}:</label><input type="number" value={formData.discount} onChange={e=>setFormData(f=>({...f, discount: parseFloat(e.target.value)}))} className="w-24 p-1 border rounded text-left"/></div><div className="flex justify-between items-center"><label>{AR_LABELS.tax} (%):</label><input type="number" value={formData.tax} onChange={e=>setFormData(f=>({...f, tax: parseFloat(e.target.value)}))} className="w-24 p-1 border rounded text-left"/></div><div className="flex justify-between font-bold text-lg border-t pt-1">{AR_LABELS.grandTotal}:<span>{formData.totalAmount.toFixed(2)}</span></div></div>
                    </div>
                    <div className="flex justify-start space-x-4 space-x-reverse pt-4"><button onClick={handleSubmit} className="px-4 py-2 bg-orange-500 text-white rounded-md">{AR_LABELS.save}</button><button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">{AR_LABELS.cancel}</button></div>
                </div>
            </div>
        </div>
    );
};

const AddPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (payment: SupplierPayment) => void;
    target: PaymentTarget;
}> = ({ isOpen, onClose, onSave, target }) => {
    const [amount, setAmount] = useState(0);
    const [method, setMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque'>('Cash');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [chequeDetails, setChequeDetails] = useState<Partial<ChequeDetails>>({});

    useEffect(() => {
        if (target) { 
            setAmount(target.defaultAmount);
            setMethod('Cash');
            setDate(new Date().toISOString().split('T')[0]);
            setNotes(target.purchaseId ? `دفعة للفاتورة ${target.purchaseId}` : '');
            setChequeDetails({});
        }
    }, [target, isOpen]);

    if (!isOpen || !target) return null;

    const handleSave = () => {
        if (method === 'Cheque' && !chequeDetails.chequeDueDate) {
            alert("تاريخ استحقاق الشيك مطلوب.");
            return;
        }

        const payment: SupplierPayment = { 
            id: UUID(), 
            supplierId: target.supplier.id, 
            purchaseId: target.purchaseId, 
            amount, 
            method, 
            date, 
            notes 
        };
        
        if (method === 'Cheque') {
            payment.chequeDetails = {
                chequeNumber: chequeDetails.chequeNumber,
                bankName: chequeDetails.bankName,
                notes: chequeDetails.notes,
                chequeAmount: amount,
                chequeDueDate: new Date(chequeDetails.chequeDueDate!).toISOString(),
                status: 'Pending'
            };
        }
        
        onSave(payment);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md text-right" onClick={e => e.stopPropagation()}>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{AR_LABELS.addPayment} لـ {target.supplier.name}</h2>
                 <div className="space-y-4">
                    <input type="number" placeholder={AR_LABELS.paymentAmount} value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md"/>
                    <select value={method} onChange={e => setMethod(e.target.value as any)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md"><option value="Cash">{AR_LABELS.cash}</option><option value="Bank Transfer">{AR_LABELS.bankTransfer}</option><option value="Cheque">{AR_LABELS.cheque}</option></select>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md"/>
                    <textarea placeholder="ملاحظات" value={notes} onChange={e => setNotes(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md"/>
                 </div>
                 {method === 'Cheque' && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-400 rounded-md space-y-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{AR_LABELS.chequeDetails}</h3>
                        <input 
                            type="text" 
                            placeholder={AR_LABELS.chequeNumber} 
                            value={chequeDetails.chequeNumber || ''} 
                            onChange={e => setChequeDetails(c => ({...c, chequeNumber: e.target.value}))} 
                            className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"
                        />
                        <input 
                            type="date" 
                            placeholder={AR_LABELS.chequeDueDate} 
                            value={chequeDetails.chequeDueDate?.split('T')[0] || ''} 
                            onChange={e => setChequeDetails(c => ({...c, chequeDueDate: e.target.value}))} 
                            className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm" 
                            required
                        />
                        <input 
                            type="text" 
                            placeholder={AR_LABELS.bankName} 
                            value={chequeDetails.bankName || ''} 
                            onChange={e => setChequeDetails(c => ({...c, bankName: e.target.value}))} 
                            className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"
                        />
                    </div>
                 )}
                  <div className="flex justify-start space-x-4 space-x-reverse pt-4">
                    <button onClick={handleSave} className="px-4 py-2 bg-orange-500 text-white rounded-md">{AR_LABELS.save}</button>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md">{AR_LABELS.cancel}</button>
                </div>
            </div>
        </div>
    )
}

// --- MAIN PAGE COMPONENT ---
const PurchasesPage: React.FC = () => {
    const [purchases, setPurchases] = useState<PurchaseOrder[]>(createInitialPurchases());
    const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS_DATA);
    const [payments, setPayments] = useState<SupplierPayment[]>(MOCK_PAYMENTS_DATA);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSupplierId, setFilteredSupplierId] = useState<string>('all');
    const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'view' | null; data: PurchaseOrder | null }>({ type: null, data: null });
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentTarget, setPaymentTarget] = useState<PaymentTarget>(null);


    const handleSavePurchase = (purchaseData: PurchaseOrder) => {
        setPurchases(prev => {
            const exists = prev.some(p => p.id === purchaseData.id);
            if(exists) { return prev.map(p => p.id === purchaseData.id ? purchaseData : p); }
            return [purchaseData, ...prev];
        });
        setModal({ type: null, data: null });
    };

    const handleSaveSupplier = (newSupplier: Supplier) => {
        setSuppliers(prev => [newSupplier, ...prev]);
        setIsSupplierModalOpen(false);
    }
    
    const handleSavePayment = (payment: SupplierPayment) => {
        setPayments(prev => [payment, ...prev]);
        alert(`تم تسجيل دفعة بقيمة ${payment.amount} للمورد.`);
    }

    const handleDelete = (purchaseId: string) => { if (window.confirm('هل أنت متأكد؟')) { setPurchases(prev => prev.filter(p => p.id !== purchaseId)); } };

    const handleStatusChange = (purchaseId: string, newStatus: PurchaseStatus) => {
        setPurchases(prev => prev.map(p => p.id === purchaseId ? {...p, status: newStatus} : p));
    }
    
    const filteredPurchases = useMemo(() => {
        return purchases.filter(p => {
            const lowerSearch = searchTerm.toLowerCase();
            const matchesSearch = searchTerm ? p.id.toLowerCase().includes(lowerSearch) || p.supplierName.toLowerCase().includes(lowerSearch) : true;
            const matchesSupplier = filteredSupplierId !== 'all' ? p.supplierId === filteredSupplierId : true;
            return matchesSearch && matchesSupplier;
        }).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    }, [purchases, searchTerm, filteredSupplierId]);

    const supplierSummary = useMemo(() => {
        if (filteredSupplierId === 'all') return null;
        const supplier = suppliers.find(s => s.id === filteredSupplierId);
        if (!supplier) return null;

        const supplierPurchases = purchases.filter(p => p.supplierId === filteredSupplierId);
        const totalPurchases = supplierPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
        
        const supplierPayments = payments.filter(p => p.supplierId === filteredSupplierId);
        const totalPaid = supplierPayments.reduce((sum, p) => sum + p.amount, 0);

        const balance = totalPurchases - totalPaid;
        return { name: supplier.name, totalPurchases, totalPaid, balance };
    }, [filteredSupplierId, purchases, payments, suppliers]);

    const handleOpenSupplierPaymentModal = () => {
        if (filteredSupplierId === 'all' || !supplierSummary) return;
        const supplier = suppliers.find(s => s.id === filteredSupplierId);
        if (supplier) {
            setPaymentTarget({
                supplier: supplier,
                defaultAmount: supplierSummary.balance > 0 ? supplierSummary.balance : 0
            });
            setIsPaymentModalOpen(true);
        }
    };
    
    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{AR_LABELS.purchaseManagement}</h1><p className="text-gray-600 dark:text-gray-400">{AR_LABELS.purchaseManagementDescription}</p></div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <div className="relative lg:col-span-2"><input type="text" placeholder={AR_LABELS.searchByPOorSupplier} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-3 pr-10 py-2 rounded-md border text-right"/><SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-gray-400" /></div>
                    <select value={filteredSupplierId} onChange={e => setFilteredSupplierId(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 rounded-md text-right"><option value="all">{AR_LABELS.allSuppliers}</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    <button onClick={() => setModal({ type: 'add', data: null })} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600"><PlusIcon className="h-4 w-4 ml-2" /><span>{AR_LABELS.addNewPurchase}</span></button>
                </div>
            </div>

            {supplierSummary && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-center items-center">
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">{AR_LABELS.totalPurchases}</p><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{supplierSummary.totalPurchases.toLocaleString('ar-SA', {style: 'currency', currency: 'SAR'})}</p></div>
                    {/* FIX: Replaced AR_LABELS.totalPaid with AR_LABELS.supplierTotalPaid to resolve type error. */}
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">{AR_LABELS.supplierTotalPaid}</p><p className="text-xl font-bold text-green-600 dark:text-green-400">{supplierSummary.totalPaid.toLocaleString('ar-SA', {style: 'currency', currency: 'SAR'})}</p></div>
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">{AR_LABELS.remainingBalance}</p><p className={`text-xl font-bold ${supplierSummary.balance >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{Math.abs(supplierSummary.balance).toLocaleString('ar-SA', {style: 'currency', currency: 'SAR'})} <span className="text-xs">{supplierSummary.balance >= 0 ? AR_LABELS.youOweSupplier : AR_LABELS.supplierOwesYou}</span></p></div>
                    <div>
                        <button
                            onClick={handleOpenSupplierPaymentModal}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <AddPaymentIcon />
                            <span className="mr-2">{AR_LABELS.addPayment}</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-right"><thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-6 py-3 text-xs font-medium uppercase">{AR_LABELS.poNumber}</th><th className="px-6 py-3 text-xs font-medium uppercase">{AR_LABELS.supplier}</th><th className="px-6 py-3 text-xs font-medium uppercase">{AR_LABELS.totalAmount}</th><th className="px-6 py-3 text-xs font-medium uppercase">{AR_LABELS.paymentMethod}</th><th className="px-6 py-3 text-xs font-medium uppercase">{AR_LABELS.date}</th><th className="px-6 py-3 text-xs font-medium uppercase">{AR_LABELS.status}</th><th className="px-6 py-3 text-xs font-medium uppercase text-center">{AR_LABELS.actions}</th></tr></thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">{filteredPurchases.map(p => (<tr key={p.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 dark:text-blue-400">{p.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{p.supplierName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{p.totalAmount.toLocaleString('ar-SA', {style: 'currency', currency: 'SAR'})}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{PAYMENT_METHOD_LABELS[p.paymentMethod]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(p.purchaseDate).toLocaleDateString('ar-SA')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><select value={p.status} onChange={e => handleStatusChange(p.id, e.target.value as PurchaseStatus)} className={`border-none rounded-md text-xs font-semibold ${STATUS_STYLES[p.status]}`}><option value="Pending">{AR_LABELS.pending}</option><option value="Completed">{AR_LABELS.completed}</option><option value="Cancelled">{AR_LABELS.cancelled}</option></select></td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <button onClick={() => setModal({ type: 'view', data: p })} className="text-blue-600 hover:text-blue-900 p-1 ml-2" title={AR_LABELS.viewDetails}><ViewIcon/></button>
                        <button onClick={() => setModal({ type: 'edit', data: p })} className="text-indigo-600 hover:text-indigo-900 p-1 ml-2" title={AR_LABELS.edit}><EditIcon/></button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900 p-1" title={AR_LABELS.delete}><DeleteIcon/></button>
                    </td>
                </tr>))}</tbody></table></div></div>
            <PurchaseFormModal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={() => setModal({type: null, data: null})} onSave={handleSavePurchase} purchaseToEdit={modal.data} suppliers={suppliers} onAddNewSupplier={() => setIsSupplierModalOpen(true)} />
            <SupplierFormModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} onSave={handleSaveSupplier} />
            <AddPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleSavePayment} target={paymentTarget} />
        </div>
    );
};

export default PurchasesPage;