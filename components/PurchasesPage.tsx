import React, { useState, useMemo, useEffect } from 'react';
import { PurchaseOrder, Supplier, PurchaseItem, Product, PurchaseStatus, PurchasePaymentMethod } from '../types';
import { 
  AR_LABELS, UUID, SearchIcon, PlusIcon, EditIcon, DeleteIcon, ViewIcon, CancelIcon
} from '../constants';

// --- MOCK DATA ---
const MOCK_SUPPLIERS: Supplier[] = [
    { id: UUID(), name: 'شركة المواد الغذائية المتحدة', contactPerson: 'أحمد خالد', phone: '0112345678', address: 'الرياض, المنطقة الصناعية', previousBalance: 15000 },
    { id: UUID(), name: 'موردو الإلكترونيات الحديثة', contactPerson: 'سارة عبدالله', phone: '0128765432', address: 'جدة, حي الشاطئ', previousBalance: 0 },
    { id: UUID(), name: 'شركة المشروبات العالمية', contactPerson: 'محمد علي', phone: '0134567890', address: 'الدمام, ميناء الملك عبدالعزيز', previousBalance: 5250.50 },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'لابتوب Dell XPS 15', category: 'إلكترونيات', price: 4500, stock: 50, barcode: 'DELL-XPS15-12345', expiryDate: '2025-12-31', createdAt: '2023-01-15' },
  { id: 2, name: 'هاتف Samsung S23', category: 'إلكترونيات', price: 2800, stock: 120, barcode: 'SAM-S23-67890', expiryDate: '2026-06-30', createdAt: new Date().toISOString() },
  { id: 3, name: 'كوكا كولا', category: 'مشروبات', price: 2.50, stock: 200, barcode: 'COKE-CAN-123', expiryDate: '2024-12-01', createdAt: '2023-12-01' },
  { id: 4, name: 'أرز بسمتي (10 كجم)', category: 'مواد غذائية', price: 50, stock: 80, barcode: 'RICE-BAS-10KG', expiryDate: '2025-06-01', createdAt: '2023-10-01' },
];

const createInitialPurchases = (): PurchaseOrder[] => [
    {
        id: `PO-${UUID()}`,
        supplierId: MOCK_SUPPLIERS[0].id,
        supplierName: MOCK_SUPPLIERS[0].name,
        items: [
            { productId: 4, productName: 'أرز بسمتي (10 كجم)', unit: 'كيس', quantity: 100, cost: 45, total: 4500, quantityReceived: 100 },
        ],
        subtotal: 4500, tax: 675, discount: 0, totalAmount: 5175,
        status: 'Received',
        purchaseDate: '2024-07-15T10:00:00Z',
        paymentMethod: 'Bank Transfer',
    },
    {
        id: `PO-${UUID()}`,
        supplierId: MOCK_SUPPLIERS[1].id,
        supplierName: MOCK_SUPPLIERS[1].name,
        items: [
            { productId: 1, productName: 'لابتوب Dell XPS 15', unit: 'قطعة', quantity: 10, cost: 4200, total: 42000, quantityReceived: 5 },
            { productId: 2, productName: 'هاتف Samsung S23', unit: 'قطعة', quantity: 20, cost: 2700, total: 54000, quantityReceived: 10 },
        ],
        subtotal: 96000, tax: 14400, discount: 1000, totalAmount: 109400,
        status: 'Partially Received',
        purchaseDate: '2024-07-20T14:30:00Z',
        paymentMethod: 'Credit',
    },
     {
        id: `PO-${UUID()}`,
        supplierId: MOCK_SUPPLIERS[2].id,
        supplierName: MOCK_SUPPLIERS[2].name,
        items: [
            { productId: 3, productName: 'كوكا كولا', unit: 'كرتون', quantity: 50, cost: 48, total: 2400 },
        ],
        subtotal: 2400, tax: 360, discount: 0, totalAmount: 2760,
        status: 'Pending',
        purchaseDate: new Date().toISOString(),
        paymentMethod: 'Cash',
    },
];

const STATUS_STYLES: Record<PurchaseStatus, string> = {
    'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'Received': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Partially Received': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};
const STATUS_LABELS: Record<PurchaseStatus, string> = {
    'Pending': AR_LABELS.pending,
    'Received': AR_LABELS.received,
    'Partially Received': AR_LABELS.partiallyReceived,
    'Cancelled': AR_LABELS.cancelled,
};
const PAYMENT_METHOD_LABELS: Record<PurchasePaymentMethod, string> = {
    'Cash': AR_LABELS.cash,
    'Bank Transfer': AR_LABELS.bankTransfer,
    'Credit': AR_LABELS.credit,
};

const EMPTY_PURCHASE_ORDER: Omit<PurchaseOrder, 'id'> = {
    supplierId: '',
    supplierName: '',
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    totalAmount: 0,
    status: 'Pending',
    purchaseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: '',
};


// --- MODAL COMPONENTS ---

// 1. Add/Edit Purchase Modal
const PurchaseFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (purchase: PurchaseOrder) => void;
  purchaseToEdit: PurchaseOrder | null;
}> = ({ isOpen, onClose, onSave, purchaseToEdit }) => {
    const [formData, setFormData] = useState<Omit<PurchaseOrder, 'id'>>(EMPTY_PURCHASE_ORDER);
    const [productSearch, setProductSearch] = useState('');

    useEffect(() => {
        setFormData(purchaseToEdit ? { ...purchaseToEdit } : { ...EMPTY_PURCHASE_ORDER });
    }, [purchaseToEdit, isOpen]);

    useEffect(() => {
        const subtotal = formData.items.reduce((acc, item) => acc + item.total, 0);
        const totalAfterDiscount = subtotal - formData.discount;
        const tax = totalAfterDiscount * (formData.tax / 100);
        const totalAmount = totalAfterDiscount + tax;
        setFormData(prev => ({ ...prev, subtotal, totalAmount }));
    }, [formData.items, formData.discount, formData.tax]);

    const handleAddItem = (product: Product) => {
        const newItem: PurchaseItem = {
            productId: product.id,
            productName: product.name,
            unit: 'قطعة',
            quantity: 1,
            cost: product.price, // Default to selling price, user can change
            total: product.price,
        };
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

    const handleRemoveItem = (productId: number) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.productId !== productId) }));
    };

    const handleSupplierChange = (supplierId: string) => {
        const supplier = MOCK_SUPPLIERS.find(s => s.id === supplierId);
        if (supplier) {
            setFormData(prev => ({...prev, supplierId: supplier.id, supplierName: supplier.name}));
        }
    };

    const handleSubmit = () => {
        if (!formData.supplierId || formData.items.length === 0) {
            alert("يرجى اختيار مورد وإضافة منتجات.");
            return;
        }
        onSave({ id: purchaseToEdit?.id || `PO-${UUID()}`, ...formData });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl text-right" onClick={e => e.stopPropagation()}>
                <div className="max-h-[85vh] overflow-y-auto pr-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{purchaseToEdit ? AR_LABELS.edit : AR_LABELS.addNewPurchase}</h2>
                    
                    {/* Header Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select value={formData.supplierId} onChange={(e) => handleSupplierChange(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm">
                            <option value="" disabled>{AR_LABELS.selectSupplier}</option>
                            {MOCK_SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input type="date" value={formData.purchaseDate.toString().split('T')[0]} onChange={e => setFormData(f=>({...f, purchaseDate: e.target.value}))} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"/>
                        <select value={formData.paymentMethod} onChange={e => setFormData(f=>({...f, paymentMethod: e.target.value as PurchasePaymentMethod}))} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm">
                            {Object.keys(PAYMENT_METHOD_LABELS).map(key => <option key={key} value={key}>{PAYMENT_METHOD_LABELS[key as PurchasePaymentMethod]}</option>)}
                        </select>
                    </div>

                    {/* Product Search & Add */}
                    <div className="relative">
                        <input type="text" placeholder="ابحث عن منتج لإضافته..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"/>
                        {productSearch && (
                            <div className="absolute z-10 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                                {MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                    <div key={p.id} onClick={() => handleAddItem(p)} className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/50 cursor-pointer text-gray-900 dark:text-gray-200">{p.name}</div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Items Table */}
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400"><tr>
                                <th className="p-2 text-xs">{AR_LABELS.productName}</th><th className="p-2 text-xs">{AR_LABELS.unit}</th>
                                <th className="p-2 text-xs">{AR_LABELS.quantity}</th><th className="p-2 text-xs">{AR_LABELS.unitCost}</th>
                                <th className="p-2 text-xs">{AR_LABELS.totalAmount}</th><th></th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {formData.items.map(item => (
                                <tr key={item.productId} className="text-gray-800 dark:text-gray-300">
                                    <td className="p-2 text-sm">{item.productName}</td>
                                    <td className="p-1"><input type="text" value={item.unit} onChange={e => handleItemChange(item.productId, 'unit', e.target.value)} className="w-20 p-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md"/></td>
                                    <td className="p-1"><input type="number" value={item.quantity} onChange={e => handleItemChange(item.productId, 'quantity', parseFloat(e.target.value))} className="w-20 p-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md"/></td>
                                    <td className="p-1"><input type="number" value={item.cost} onChange={e => handleItemChange(item.productId, 'cost', parseFloat(e.target.value))} className="w-24 p-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md"/></td>
                                    <td className="p-2 text-sm font-semibold">{item.total.toFixed(2)}</td>
                                    <td className="p-1"><button onClick={() => handleRemoveItem(item.productId)} className="text-red-500"><DeleteIcon/></button></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                    
                    {/* Summary & Footer */}
                    <div className="flex justify-between items-end">
                        <div className="w-1/2 space-y-2">
                             <textarea placeholder="ملاحظات..." value={formData.notes} onChange={e => setFormData(f=>({...f, notes: e.target.value}))} className="w-full h-24 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm"/>
                        </div>
                        <div className="w-1/3 space-y-1 text-sm text-gray-800 dark:text-gray-300">
                            <div className="flex justify-between"><span>{AR_LABELS.subtotal}:</span><span>{formData.subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center">
                                <label>{AR_LABELS.discount}:</label>
                                <input type="number" value={formData.discount} onChange={e=>setFormData(f=>({...f, discount: parseFloat(e.target.value)}))} className="w-24 p-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-left"/>
                            </div>
                             <div className="flex justify-between items-center">
                                <label>{AR_LABELS.tax} (%):</label>
                                <input type="number" value={formData.tax} onChange={e=>setFormData(f=>({...f, tax: parseFloat(e.target.value)}))} className="w-24 p-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-left"/>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-600 pt-1">{AR_LABELS.grandTotal}:<span>{formData.totalAmount.toFixed(2)}</span></div>
                        </div>
                    </div>

                    <div className="flex justify-start space-x-4 space-x-reverse pt-4">
                        <button onClick={handleSubmit} className="px-4 py-2 bg-orange-500 text-white rounded-md">{AR_LABELS.save}</button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md">{AR_LABELS.cancel}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. View Purchase Modal
const ViewPurchaseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  purchase: PurchaseOrder | null;
}> = ({ isOpen, onClose, purchase }) => {
    if (!isOpen || !purchase) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl text-right" onClick={e => e.stopPropagation()}>
                <div className="max-h-[85vh] overflow-y-auto pr-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{AR_LABELS.viewPurchaseDetails} - {purchase.id}</h2>
                    <div className="grid grid-cols-3 gap-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm text-gray-800 dark:text-gray-300">
                        <div><strong>{AR_LABELS.supplier}:</strong> {purchase.supplierName}</div>
                        <div><strong>{AR_LABELS.purchaseDate}:</strong> {new Date(purchase.purchaseDate).toLocaleDateString('ar-SA')}</div>
                        <div><strong>{AR_LABELS.paymentMethod}:</strong> {PAYMENT_METHOD_LABELS[purchase.paymentMethod]}</div>
                        <div><strong>{AR_LABELS.status}:</strong> <span className={`px-2 py-1 text-xs rounded-full ${STATUS_STYLES[purchase.status]}`}>{STATUS_LABELS[purchase.status]}</span></div>
                    </div>
                     <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400"><tr>
                            <th className="p-2 text-xs">المنتج</th><th className="p-2 text-xs">الكمية المطلوبة</th>
                            <th className="p-2 text-xs">الكمية المستلمة</th><th className="p-2 text-xs">التكلفة</th><th className="p-2 text-xs">الإجمالي</th>
                        </tr></thead>
                        <tbody className="text-gray-800 dark:text-gray-300">
                          {purchase.items.map(item => (
                            <tr key={item.productId}>
                                <td className="p-2">{item.productName}</td><td className="p-2">{item.quantity}</td>
                                <td className="p-2">{item.quantityReceived || 0}</td><td className="p-2">{item.cost.toFixed(2)}</td><td className="p-2">{item.total.toFixed(2)}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                    <div className="flex justify-end">
                         <div className="w-1/3 space-y-1 text-sm text-right text-gray-800 dark:text-gray-300">
                            <p><strong>{AR_LABELS.subtotal}:</strong> {purchase.subtotal.toFixed(2)}</p>
                            <p><strong>{AR_LABELS.discount}:</strong> {purchase.discount.toFixed(2)}</p>
                            <p><strong>{AR_LABELS.tax}:</strong> {purchase.tax.toFixed(2)}</p>
                            <p className="font-bold text-lg"><strong>{AR_LABELS.grandTotal}:</strong> {purchase.totalAmount.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex justify-start space-x-4 space-x-reverse pt-4">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md">إغلاق</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. Receive Stock Modal
const ReceiveStockModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (purchase: PurchaseOrder) => void;
  purchase: PurchaseOrder | null;
}> = ({ isOpen, onClose, onSave, purchase }) => {
    const [receivedQuantities, setReceivedQuantities] = useState<Record<number, number>>({});

    useEffect(() => {
        if(purchase) {
            const initialQtys = purchase.items.reduce((acc, item) => {
                acc[item.productId] = 0;
                return acc;
            }, {} as Record<number, number>);
            setReceivedQuantities(initialQtys);
        }
    }, [purchase, isOpen]);

    if (!isOpen || !purchase) return null;

    const handleReceive = () => {
        let allReceived = true;
        const newItems = purchase.items.map(item => {
            const receivedNow = receivedQuantities[item.productId] || 0;
            const newTotalReceived = (item.quantityReceived || 0) + receivedNow;
            if (newTotalReceived < item.quantity) {
                allReceived = false;
            }
            return { ...item, quantityReceived: newTotalReceived };
        });

        const newStatus: PurchaseStatus = allReceived ? 'Received' : 'Partially Received';
        onSave({ ...purchase, items: newItems, status: newStatus });
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl text-right" onClick={e => e.stopPropagation()}>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{AR_LABELS.receivePurchase} - {purchase.id}</h2>
                 <table className="min-w-full my-4 text-gray-800 dark:text-gray-300">
                     <thead className="text-gray-600 dark:text-gray-400"><tr>
                         <th className="p-2 text-xs">المنتج</th><th className="p-2 text-xs">المطلوب</th>
                         <th className="p-2 text-xs">المستلم سابقاً</th><th className="p-2 text-xs">الكمية المستلمة الآن</th>
                     </tr></thead>
                     <tbody>{purchase.items.map(item => {
                         const remaining = item.quantity - (item.quantityReceived || 0);
                         return (
                            <tr key={item.productId}>
                                <td className="p-2">{item.productName}</td><td className="p-2">{item.quantity}</td>
                                <td className="p-2">{item.quantityReceived || 0}</td>
                                <td className="p-1">
                                    <input type="number" min="0" max={remaining} value={receivedQuantities[item.productId]} onChange={e => setReceivedQuantities(q => ({...q, [item.productId]: Math.min(parseInt(e.target.value), remaining)}))} className="w-24 p-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md"/>
                                </td>
                            </tr>
                        )
                     })}</tbody>
                 </table>
                 <div className="flex justify-start space-x-4 space-x-reverse pt-4">
                    <button onClick={handleReceive} className="px-4 py-2 bg-green-500 text-white rounded-md">تأكيد الاستلام</button>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md">{AR_LABELS.cancel}</button>
                </div>
            </div>
         </div>
    );
};

// --- MAIN PAGE COMPONENT ---
const PurchasesPage: React.FC = () => {
    const [purchases, setPurchases] = useState<PurchaseOrder[]>(createInitialPurchases());
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: 'all', date: 'all' });
    const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'view' | 'receive' | null; data: PurchaseOrder | null }>({ type: null, data: null });

    const handleSave = (purchaseData: PurchaseOrder) => {
        setPurchases(prev => {
            const exists = prev.some(p => p.id === purchaseData.id);
            if(exists) {
                return prev.map(p => p.id === purchaseData.id ? purchaseData : p);
            }
            return [purchaseData, ...prev];
        });
        setModal({ type: null, data: null });
    };

    const handleDelete = (purchaseId: string) => {
        if (window.confirm('هل أنت متأكد من حذف طلب الشراء هذا؟ لا يمكن التراجع عن هذا الإجراء.')) {
            setPurchases(prev => prev.filter(p => p.id !== purchaseId));
        }
    };
    
    const filteredPurchases = useMemo(() => {
        return purchases.filter(p => {
            const lowerSearch = searchTerm.toLowerCase();
            const matchesSearch = searchTerm ? 
                p.id.toLowerCase().includes(lowerSearch) ||
                p.supplierName.toLowerCase().includes(lowerSearch) ||
                p.items.some(item => item.productName.toLowerCase().includes(lowerSearch))
                : true;
            
            const matchesStatus = filters.status !== 'all' ? p.status === filters.status : true;
            
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    }, [purchases, searchTerm, filters]);
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{AR_LABELS.purchaseManagement}</h1>
                <p className="text-gray-600 dark:text-gray-400">{AR_LABELS.purchaseManagementDescription}</p>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <div className="relative lg:col-span-2">
                        <input type="text" placeholder={AR_LABELS.searchByPOorSupplier} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-3 pr-10 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-orange-500 text-right"/>
                        <SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <select onChange={e => setFilters(f => ({...f, status: e.target.value}))} className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md shadow-sm text-right">
                        <option value="all">{AR_LABELS.allStatuses}</option>
                        {Object.keys(STATUS_LABELS).map(key => <option key={key} value={key}>{STATUS_LABELS[key as PurchaseStatus]}</option>)}
                    </select>
                    <button onClick={() => setModal({ type: 'add', data: null })} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600">
                        <PlusIcon className="h-4 w-4 ml-2" /><span>{AR_LABELS.addNewPurchase}</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-right">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{AR_LABELS.poNumber}</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{AR_LABELS.supplier}</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{AR_LABELS.itemsCount}</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{AR_LABELS.totalAmount}</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{AR_LABELS.date}</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{AR_LABELS.status}</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-center">{AR_LABELS.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredPurchases.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 dark:text-blue-400">{p.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">{p.supplierName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{p.items.length}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-300">{p.totalAmount.toLocaleString('ar-SA', {style: 'currency', currency: 'SAR'})}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{new Date(p.purchaseDate).toLocaleDateString('ar-SA')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_STYLES[p.status]}`}>
                                            {STATUS_LABELS[p.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                        <button onClick={() => setModal({ type: 'receive', data: p })} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 ml-2" title={AR_LABELS.markAsReceived}>
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                                        </button>
                                        <button onClick={() => setModal({ type: 'view', data: p })} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 ml-2" title={AR_LABELS.viewDetails}><ViewIcon/></button>
                                        <button onClick={() => setModal({ type: 'edit', data: p })} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 ml-2" title={AR_LABELS.edit}><EditIcon/></button>
                                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1" title={AR_LABELS.delete}><DeleteIcon/></button>
                                    </td>
                                </tr>
                            ))}
                            {filteredPurchases.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">{AR_LABELS.noSalesFound}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <PurchaseFormModal 
                isOpen={modal.type === 'add' || modal.type === 'edit'}
                onClose={() => setModal({type: null, data: null})}
                onSave={handleSave}
                purchaseToEdit={modal.data}
            />
            <ViewPurchaseModal
                isOpen={modal.type === 'view'}
                onClose={() => setModal({type: null, data: null})}
                purchase={modal.data}
            />
             <ReceiveStockModal
                isOpen={modal.type === 'receive'}
                onClose={() => setModal({type: null, data: null})}
                onSave={handleSave}
                purchase={modal.data}
            />
        </div>
    );
};

export default PurchasesPage;