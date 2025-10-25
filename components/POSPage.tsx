import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, Customer, POSInvoice, POSCartItem } from '../types';
import { AR_LABELS, UUID, SearchIcon, DeleteIcon, PlusIcon, HandIcon, CancelIcon, PrintIcon, ToggleSwitch, CheckCircleIcon } from '../constants';

// --- MOCK DATA ---
const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'لابتوب Dell XPS 15', category: 'إلكترونيات', price: 1200.00, costPrice: 950.00, stock: 50, barcode: '629100100001', expiryDate: '2025-12-31', createdAt: '2023-01-15' },
  { id: 2, name: 'هاتف Samsung S23', category: 'إلكترونيات', price: 899.99, costPrice: 700.00, stock: 120, barcode: '629100100002', expiryDate: '2026-06-30', createdAt: new Date().toISOString() },
  { id: 3, name: 'كوكا كولا', category: 'مشروبات', price: 2.50, costPrice: 1.50, stock: 200, barcode: '629100100003', expiryDate: '2024-12-01', createdAt: '2023-12-01' },
  { id: 4, name: 'ماء (صغير)', category: 'مشروبات', price: 1.00, costPrice: 0.50, stock: 500, barcode: '629100100004', expiryDate: '2025-01-01', createdAt: '2023-11-01' },
  { id: 5, name: 'ليز بالملح', category: 'وجبات خفيفة', price: 3.00, costPrice: 1.80, stock: 150, barcode: '629100100005', expiryDate: '2024-08-01', createdAt: '2023-12-10' },
  { id: 6, name: 'سماعات Sony XM5', category: 'إلكترونيات', price: 349.00, costPrice: 250.00, stock: 8, barcode: '629100100006', expiryDate: '2027-01-01', createdAt: '2023-09-01' },
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
    const [saleCompleted, setSaleCompleted] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Cash');
    const [creditPaidAmount, setCreditPaidAmount] = useState(0);
    const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
    
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
    
    useEffect(() => {
        if (saleCompleted && autoPrintEnabled) {
            const timer = setTimeout(() => window.print(), 300); // Small delay to ensure render
            return () => clearTimeout(timer);
        }
    }, [saleCompleted, autoPrintEnabled]);

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
        setSelectedPaymentMethod('Cash');
        setCreditPaidAmount(0);
    }
    
    const handleFinalizePayment = () => {
        if (currentInvoice.items.length === 0) return;

        if (selectedPaymentMethod === 'Credit' && (!currentInvoice.customer || currentInvoice.customer.name === 'عميل نقدي')) {
            alert(AR_LABELS.selectRegisteredCustomerForCredit);
            return;
        }

        if (selectedPaymentMethod === 'Credit' && creditPaidAmount < 0) {
            alert('المبلغ المدفوع لا يمكن أن يكون سالباً.');
            return;
        }
        
        const finalInvoice = { ...currentInvoice, paymentMethod: selectedPaymentMethod };
        console.log('Sale Finalized:', finalInvoice);
        setCurrentInvoice(finalInvoice);
        setSaleCompleted(true);
    };

    if (saleCompleted) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-900 p-4">
                <div id="printable-receipt" className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-right">
                    <div className="text-center mb-4">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto print-hidden" />
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2 print-hidden">{AR_LABELS.saleCompleted}</h2>
                        <h3 className="text-xl font-bold text-center text-gray-900 dark:text-gray-100 mt-4">PoshPointHub</h3>
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400">123 الشارع التجاري, الرياض, السعودية</p>
                    </div>

                    <div className="text-xs my-4 space-y-1 border-b border-dashed pb-2">
                        <p><strong>{AR_LABELS.invoiceNumber}:</strong> {currentInvoice.id}</p>
                        <p><strong>{AR_LABELS.date}:</strong> {new Date(currentInvoice.date).toLocaleString('ar-SA')}</p>
                        <p><strong>{AR_LABELS.posCashier}:</strong> {currentInvoice.cashier}</p>
                        <p><strong>{AR_LABELS.customerName}:</strong> {currentInvoice.customer?.name || 'N/A'}</p>
                    </div>
                    
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b-2 border-dashed border-gray-400 dark:border-gray-500">
                                <th className="py-1 text-right font-semibold">الصنف</th>
                                <th className="py-1 text-center font-semibold">الكمية</th>
                                <th className="py-1 text-center font-semibold">السعر</th>
                                <th className="py-1 text-left font-semibold">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentInvoice.items.map(item => (
                                <tr key={item.productId} className="border-b border-dashed border-gray-300 dark:border-gray-600">
                                    <td className="py-1">{item.name}</td>
                                    <td className="py-1 text-center">{item.quantity}</td>
                                    <td className="py-1 text-center">{item.unitPrice.toFixed(2)}</td>
                                    <td className="py-1 text-left">{(item.total - item.discount * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-4 text-xs space-y-1">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">{AR_LABELS.subtotal}:</span><span>{currentInvoice.subtotal.toFixed(2)} ر.س</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">{AR_LABELS.totalDiscount}:</span><span>-{(currentInvoice.totalItemDiscount + currentInvoice.invoiceDiscount).toFixed(2)} ر.س</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">{AR_LABELS.tax}:</span><span>+{currentInvoice.tax.toFixed(2)} ر.س</span></div>
                        <div className="flex justify-between font-bold text-base border-t dark:border-gray-600 pt-1 mt-1"><span className="text-gray-800 dark:text-gray-100">{AR_LABELS.grandTotal}:</span><span className="text-orange-600">{currentInvoice.grandTotal.toFixed(2)} ر.س</span></div>
                    </div>
                    <p className="text-center text-xs mt-6 text-gray-500 dark:text-gray-400">شكراً لتسوقكم!</p>
                </div>
                
                <div className="flex space-x-4 space-x-reverse mt-6 print-hidden">
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
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-between items-end">
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
                    <div className="w-72 flex-shrink-0 flex flex-col gap-2">
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => { setSelectedPaymentMethod('Cash'); setCreditPaidAmount(0); }} className={`p-2 rounded-md border-2 text-center font-semibold text-sm ${selectedPaymentMethod === 'Cash' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-gray-200 dark:border-gray-600'}`}>{AR_LABELS.cash}</button>
                            <button onClick={() => { setSelectedPaymentMethod('Card'); setCreditPaidAmount(0); }} className={`p-2 rounded-md border-2 text-center font-semibold text-sm ${selectedPaymentMethod === 'Card' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-gray-200 dark:border-gray-600'}`}>{AR_LABELS.visa}</button>
                            <button onClick={() => setSelectedPaymentMethod('Credit')} className={`p-2 rounded-md border-2 text-center font-semibold text-sm ${selectedPaymentMethod === 'Credit' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-gray-200 dark:border-gray-600'}`}>{AR_LABELS.credit}</button>
                        </div>
                        {selectedPaymentMethod === 'Credit' && (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 text-right mb-1">{AR_LABELS.amountPaid}</label>
                                <input type="number" value={creditPaidAmount} onChange={e => setCreditPaidAmount(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md text-center font-bold" min="0" />
                            </div>
                        )}
                        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md">
                            <ToggleSwitch
                                enabled={autoPrintEnabled}
                                onChange={setAutoPrintEnabled}
                            />
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {AR_LABELS.autoPrintInvoice}
                            </label>
                        </div>
                        <button onClick={handleFinalizePayment} disabled={currentInvoice.items.length === 0} className="w-full px-4 py-3 text-base font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600">{AR_LABELS.confirmPayment}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POSPage;