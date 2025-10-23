import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, Customer, POSInvoice, POSCartItem } from '../types';
import { AR_LABELS, UUID, SearchIcon, DeleteIcon, PlusIcon, HandIcon, CancelIcon, PrintIcon } from '../constants';

// --- MOCK DATA ---
const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'لابتوب Dell XPS 15', category: 'إلكترونيات', price: 1200.00, stock: 50, barcode: '629100100001', expiryDate: '2025-12-31', createdAt: '2023-01-15' },
  { id: 2, name: 'هاتف Samsung S23', category: 'إلكترونيات', price: 899.99, stock: 120, barcode: '629100100002', expiryDate: '2026-06-30', createdAt: new Date().toISOString() },
  { id: 3, name: 'كوكا كولا', category: 'مشروبات', price: 2.50, stock: 200, barcode: '629100100003', expiryDate: '2024-12-01', createdAt: '2023-12-01' },
  { id: 4, name: 'ماء (صغير)', category: 'مشروبات', price: 1.00, stock: 500, barcode: '629100100004', expiryDate: '2025-01-01', createdAt: '2023-11-01' },
  { id: 5, name: 'ليز بالملح', category: 'وجبات خفيفة', price: 3.00, stock: 150, barcode: '629100100005', expiryDate: '2024-08-01', createdAt: '2023-12-10' },
  { id: 6, name: 'سماعات Sony XM5', category: 'إلكترونيات', price: 349.00, stock: 8, barcode: '629100100006', expiryDate: '2027-01-01', createdAt: '2023-09-01' },
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: UUID(), name: 'علي محمد', phone: '0501234567', previousBalance: 0 },
  { id: UUID(), name: 'فاطمة الزهراء', phone: '0557654321', previousBalance: 150.75 },
  { id: UUID(), name: 'عميل نقدي', phone: 'N/A', previousBalance: 0 },
];

const QUICK_PRODUCTS = MOCK_PRODUCTS.slice(2, 6); // Coke, Water, Lays, Sony Headphones

const generateNewInvoice = (cashierName: string): POSInvoice => ({
  id: `INV-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
  date: new Date(),
  cashier: cashierName,
  customer: MOCK_CUSTOMERS.find(c => c.name === 'عميل نقدي') || null,
  items: [],
  subtotal: 0,
  totalItemDiscount: 0,
  invoiceDiscount: 0,
  tax: 0,
  grandTotal: 0,
  paymentMethod: null,
});

// --- MAIN POS COMPONENT ---
const POSPage: React.FC = () => {
    const [currentInvoice, setCurrentInvoice] = useState<POSInvoice>(() => generateNewInvoice(AR_LABELS.ahmadSai));
    const [heldInvoices, setHeldInvoices] = useState<POSInvoice[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [amountReceived, setAmountReceived] = useState(0);
    const [saleCompleted, setSaleCompleted] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    
    const calculateTotals = useCallback((items: POSCartItem[], invoiceDiscount: number): Pick<POSInvoice, 'subtotal' | 'totalItemDiscount' | 'tax' | 'grandTotal'> => {
        const subtotal = items.reduce((acc, item) => acc + item.total, 0);
        const totalItemDiscount = items.reduce((acc, item) => acc + item.discount * item.quantity, 0);
        const totalDiscountValue = totalItemDiscount + invoiceDiscount;
        // Assuming 15% tax for demonstration
        const tax = (subtotal - totalDiscountValue) * 0.15;
        const grandTotal = subtotal - totalDiscountValue + tax;
        return { subtotal, totalItemDiscount, tax, grandTotal };
    }, []);

    useEffect(() => {
        const newTotals = calculateTotals(currentInvoice.items, currentInvoice.invoiceDiscount);
        setCurrentInvoice(inv => ({ ...inv, ...newTotals }));
    }, [currentInvoice.items, currentInvoice.invoiceDiscount, calculateTotals]);

    const handleAddProduct = (product: Product, unit = 'قطعة') => {
        const existingItem = currentInvoice.items.find(item => item.productId === product.id);
        if (existingItem) {
            handleUpdateQuantity(product.id, existingItem.quantity + 1);
        } else {
            const newItem: POSCartItem = {
                productId: product.id,
                name: product.name,
                unit: unit,
                quantity: 1,
                unitPrice: product.price,
                total: product.price,
                discount: 0,
            };
            setCurrentInvoice(inv => ({ ...inv, items: [...inv.items, newItem] }));
        }
    };
    
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) return;
        const foundProduct = MOCK_PRODUCTS.find(p => p.barcode === searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (foundProduct) {
            handleAddProduct(foundProduct);
            setSearchTerm('');
        } else {
            alert('المنتج غير موجود');
        }
    };

    const handleUpdateQuantity = (productId: number, quantity: number) => {
        if (quantity < 1) {
            handleRemoveItem(productId);
            return;
        }
        setCurrentInvoice(inv => ({
            ...inv,
            items: inv.items.map(item =>
                item.productId === productId ? { ...item, quantity: quantity, total: item.unitPrice * quantity } : item
            ),
        }));
    };

    const handleUpdateItemDiscount = (productId: number, discount: number) => {
        setCurrentInvoice(inv => ({
            ...inv,
            items: inv.items.map(item =>
                item.productId === productId ? { ...item, discount: Math.max(0, discount) } : item
            ),
        }));
    };

    const handleRemoveItem = (productId: number) => {
        setCurrentInvoice(inv => ({
            ...inv,
            items: inv.items.filter(item => item.productId !== productId),
        }));
    };

    const handleHoldSale = () => {
        if (currentInvoice.items.length === 0) return;
        setHeldInvoices(prev => [...prev, currentInvoice]);
        setCurrentInvoice(generateNewInvoice(AR_LABELS.ahmadSai));
    };

    const handleRestoreSale = (invoiceId: string) => {
        const invoiceToRestore = heldInvoices.find(inv => inv.id === invoiceId);
        if (invoiceToRestore) {
            setHeldInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
            setCurrentInvoice(invoiceToRestore);
        }
    };
    
    const startNewSale = () => {
        setSaleCompleted(false);
        setCurrentInvoice(generateNewInvoice(AR_LABELS.ahmadSai));
    }
    
    const openPaymentModal = () => {
        if (currentInvoice.items.length === 0) return;
        setSelectedPaymentMethod('Cash');
        setAmountReceived(currentInvoice.grandTotal);
        setPaymentModalOpen(true);
    };

    const handleFinalizePayment = () => {
        if (!selectedPaymentMethod) {
            alert('الرجاء اختيار طريقة الدفع.');
            return;
        }
        if (selectedPaymentMethod === 'Credit' && (!currentInvoice.customer || currentInvoice.customer.name === 'عميل نقدي')) {
            alert(AR_LABELS.selectRegisteredCustomerForCredit);
            return;
        }
        if (selectedPaymentMethod === 'Cash' && amountReceived < currentInvoice.grandTotal) {
            alert('المبلغ المستلم أقل من الإجمالي');
            return;
        }
        
        const finalInvoice = { ...currentInvoice, paymentMethod: selectedPaymentMethod };
        console.log('Sale Finalized:', finalInvoice);

        setPaymentModalOpen(false);
        setSaleCompleted(true);
        setSelectedPaymentMethod(null);
    };

    const change = useMemo(() => {
        if(selectedPaymentMethod !== 'Cash') return 0;
        return amountReceived - currentInvoice.grandTotal;
    }, [amountReceived, currentInvoice.grandTotal, selectedPaymentMethod]);

    if (saleCompleted) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center p-8">
                <svg className="w-24 h-24 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{AR_LABELS.saleCompleted}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">رقم الفاتورة: {currentInvoice.id}</p>
                <div className="flex space-x-4 space-x-reverse">
                    <button onClick={startNewSale} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600">
                        <PlusIcon className="h-5 w-5 ml-2" />
                        <span>{AR_LABELS.startNewSale}</span>
                    </button>
                     <button onClick={() => window.print()} className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <PrintIcon />
                        <span className="mr-2">{AR_LABELS.printReceipt}</span>
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-row-reverse h-[calc(100vh-10rem)] gap-4">
           {/* Left Panel (Action Panel in RTL) */}
            <div className="w-1/3 flex flex-col gap-4">
                {/* Customer & Held Invoices */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 text-right">{AR_LABELS.customerName}</h3>
                    <select 
                        value={currentInvoice.customer?.id || ''}
                        onChange={(e) => {
                            const customer = MOCK_CUSTOMERS.find(c => c.id === e.target.value);
                            setCurrentInvoice(inv => ({...inv, customer: customer || null}));
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md text-right"
                    >
                        {MOCK_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button className="w-full text-center text-sm text-orange-600 hover:underline">{AR_LABELS.addNewCustomer}</button>
                    
                    {heldInvoices.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200 text-right mb-2">{AR_LABELS.heldInvoices}</h3>
                            <div className="space-y-2 max-h-24 overflow-y-auto">
                                {heldInvoices.map(inv => (
                                    <div key={inv.id} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
                                        <span className="text-sm text-gray-800 dark:text-gray-300">{inv.id} ({inv.items.length} أصناف)</span>
                                        <button onClick={() => handleRestoreSale(inv.id)} className="text-sm text-green-600 hover:underline">{AR_LABELS.restore}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {/* Quick Products */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex-grow">
                     <h3 className="font-bold text-gray-700 dark:text-gray-200 text-right mb-2">{AR_LABELS.quickProducts}</h3>
                     <div className="grid grid-cols-2 gap-2">
                        {QUICK_PRODUCTS.map(p => (
                            <button key={p.id} onClick={() => handleAddProduct(p)} className="p-2 border border-gray-200 dark:border-gray-700 rounded-md text-center hover:bg-orange-50 dark:hover:bg-gray-700">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{p.name}</span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">{p.price.toFixed(2)} ر.س</span>
                            </button>
                        ))}
                     </div>
                </div>
            </div>

            {/* Right Panel (Main Transaction in RTL) */}
            <div className="w-2/3 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow">
                 {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 flex justify-between">
                    <span>{AR_LABELS.invoiceNumber}: <span className="font-mono">{currentInvoice.id}</span></span>
                    {/* FIX: Use the renamed 'posCashier' key to correctly display the label. */}
                    <span>{AR_LABELS.posCashier}: {currentInvoice.cashier}</span>
                </div>
                {/* Search */}
                <form onSubmit={handleSearch} className="p-4 border-b border-gray-200 dark:border-gray-700">
                     <div className="relative">
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={AR_LABELS.searchProductPlaceholder} className="w-full pl-3 pr-10 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-orange-500 text-right"/>
                        <SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                     </div>
                </form>
                {/* Cart */}
                <div className="flex-grow overflow-y-auto">
                    <table className="min-w-full text-right">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                                <th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{AR_LABELS.productName}</th>
                                <th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{AR_LABELS.quantity}</th>
                                <th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{AR_LABELS.price}</th>
                                <th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{AR_LABELS.discount}</th>
                                <th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{AR_LABELS.totalAmount}</th>
                                <th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                           {currentInvoice.items.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">{AR_LABELS.noItemsInCart}</td></tr>
                           ) : currentInvoice.items.map((item, index) => (
                                <tr key={item.productId}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">{item.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        <input type="number" value={item.quantity} onChange={e => handleUpdateQuantity(item.productId, parseInt(e.target.value, 10) || 1)} className="w-16 text-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md"/>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.unitPrice.toFixed(2)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        <input type="number" value={item.discount} onChange={e => handleUpdateItemDiscount(item.productId, parseFloat(e.target.value) || 0)} className="w-16 text-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md"/>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{(item.total - (item.discount * item.quantity)).toFixed(2)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <button onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-700 p-1"><DeleteIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Footer Totals & Actions */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button onClick={handleHoldSale} disabled={currentInvoice.items.length === 0} className="inline-flex items-center px-4 py-2 border border-yellow-400 dark:border-yellow-600 text-sm font-medium rounded-md text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 disabled:opacity-50">
                           <HandIcon /><span className="mr-2">{AR_LABELS.holdSale}</span>
                        </button>
                        <button onClick={() => startNewSale()} className="inline-flex items-center px-4 py-2 border border-red-400 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60">
                            <CancelIcon className="w-4 h-4" /><span className="mr-2">{AR_LABELS.cancel}</span>
                        </button>
                    </div>
                    <div className="text-right space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <p>{AR_LABELS.subtotal}: <span className="font-semibold">{currentInvoice.subtotal.toFixed(2)} ر.س</span></p>
                        <div className="flex items-center justify-end">
                            <label htmlFor="invoiceDiscount" className="ml-2">{AR_LABELS.invoiceDiscount}:</label>
                            <input
                                type="number"
                                id="invoiceDiscount"
                                value={currentInvoice.invoiceDiscount}
                                onChange={e => setCurrentInvoice(inv => ({...inv, invoiceDiscount: parseFloat(e.target.value) || 0}))}
                                className="w-20 text-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md font-semibold"
                            />
                        </div>
                         <p>{AR_LABELS.totalDiscount}: <span className="font-semibold text-red-600">{(currentInvoice.totalItemDiscount + currentInvoice.invoiceDiscount).toFixed(2)} ر.س</span></p>
                        <p>{AR_LABELS.tax} (15%): <span className="font-semibold">{currentInvoice.tax.toFixed(2)} ر.س</span></p>
                        <p className="text-xl font-bold text-orange-600">{AR_LABELS.grandTotal}: <span>{currentInvoice.grandTotal.toFixed(2)} ر.س</span></p>
                    </div>
                    <button onClick={openPaymentModal} disabled={currentInvoice.items.length === 0} className="px-8 py-4 text-lg font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600">
                        {AR_LABELS.payNow}
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            {paymentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md text-right">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{AR_LABELS.payment}</h2>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{AR_LABELS.paymentMethod}</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setSelectedPaymentMethod('Cash')} className={`p-3 rounded-md border-2 text-center font-semibold ${selectedPaymentMethod === 'Cash' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'}`}>
                                    {AR_LABELS.cash}
                                </button>
                                <button onClick={() => setSelectedPaymentMethod('Card')} className={`p-3 rounded-md border-2 text-center font-semibold ${selectedPaymentMethod === 'Card' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'}`}>
                                    {AR_LABELS.visa}
                                </button>
                                <button onClick={() => setSelectedPaymentMethod('Credit')} className={`p-3 rounded-md border-2 text-center font-semibold ${selectedPaymentMethod === 'Credit' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'}`}>
                                    {AR_LABELS.credit}
                                </button>
                            </div>
                        </div>

                        <div className="mb-4 p-4 bg-orange-50 dark:bg-gray-700 rounded-md text-center">
                            <p className="text-lg text-gray-600 dark:text-gray-300">{AR_LABELS.grandTotal}</p>
                            <p className="text-4xl font-mono font-bold text-orange-600">{currentInvoice.grandTotal.toFixed(2)}</p>
                        </div>
                        
                        {selectedPaymentMethod === 'Cash' && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{AR_LABELS.amountReceived}</label>
                                    <input type="number" value={amountReceived} onChange={e => setAmountReceived(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md text-center text-lg font-bold" />
                                </div>
                                <div className="mb-6 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md text-center">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{AR_LABELS.change}</p>
                                    <p className={`text-2xl font-mono font-bold ${change < 0 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>{change.toFixed(2)}</p>
                                </div>
                            </>
                        )}

                        <div className="flex justify-between gap-2">
                           <button onClick={() => setPaymentModalOpen(false)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">{AR_LABELS.cancel}</button>
                           <button onClick={handleFinalizePayment} className="w-full px-4 py-2 bg-green-500 text-white rounded-md">{AR_LABELS.confirmPayment}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSPage;