import { Head, Link, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Minus, Trash2, ShoppingCart, DollarSign, CreditCard, Printer, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CartItem {
    product_id: string;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    discount_amount: number;
    tax_percent: number;
    tax_amount: number;
    subtotal: number;
    total: number;
    is_wholesale?: boolean;
    wholesale_info_string?: string;
}

export default function POSIndex() {
    const { props } = usePage();
    const { auth, products, categories, customers, branch, saleNumber, filters } = props as any;

    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paidAmount, setPaidAmount] = useState(0);
    const [cashAmount, setCashAmount] = useState(0);
    const [transferAmount, setTransferAmount] = useState(0);
    const [extraCharge, setExtraCharge] = useState(0);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [selectedProductForPrice, setSelectedProductForPrice] = useState<any>(null);

    // Format currency for Indonesian Rupiah (no decimal places)
    const formatIDR = (value: number) => {
        return Math.round(value).toLocaleString('id-ID');
    };

    useEffect(() => {
        let barcodeBuffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            // Abaikan jika user sedang mengetik di dalam input text
            if (e.target instanceof HTMLInputElement && e.target.type === 'text') {
                return;
            }

            const currentTime = Date.now();
            
            // Jika jeda antar ketikan lebih dari 50ms, anggap itu ketikan manual, bukan scanner
            if (currentTime - lastKeyTime > 50) {
                barcodeBuffer = '';
            }

            if (e.key === 'Enter' && barcodeBuffer.length > 0) {
                e.preventDefault();
                const scannedProduct = products.find((p: any) => p.sku === barcodeBuffer || p.barcode === barcodeBuffer);
                if (scannedProduct) {
                    addToCart(scannedProduct);
                } else {
                    alert(`Produk dengan Barcode/SKU ${barcodeBuffer} tidak ditemukan!`);
                }
                barcodeBuffer = '';
            } else if (e.key.length === 1) {
                barcodeBuffer += e.key;
            }

            lastKeyTime = currentTime;
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [products, cart]);

    const addToCart = (product: any, overridePrice: number | null = null, overrideQuantity: number = 1) => {
        if (!overridePrice && product.prices && product.prices.length > 0) {
            setSelectedProductForPrice(product);
            setShowPriceModal(true);
            return;
        }

        let wholesaleInfoString = '';
        if (!overridePrice && product.wholesale_prices && product.wholesale_prices.length > 0) {
            const sortedWholesale = [...product.wholesale_prices].sort((a: any, b: any) => a.min_qty - b.min_qty);
            wholesaleInfoString = sortedWholesale.map((wp: any) => `≥${wp.min_qty}pcs: Rp ${formatIDR(wp.price)}`).join(' | ');
        }

        const existingItem = cart.find((item) => item.product_id === product.id);

        if (existingItem) {
            updateQuantity(existingItem.product_id, existingItem.quantity + overrideQuantity);
        } else {
            let price = overridePrice || Number(product.selling_price) || 0;
            let isWholesale = false;

            if (!overridePrice && product.wholesale_prices && product.wholesale_prices.length > 0) {
                const sortedWholesale = [...product.wholesale_prices].sort((a, b) => b.min_qty - a.min_qty);
                for (const wp of sortedWholesale) {
                    if (overrideQuantity >= wp.min_qty) {
                        price = Number(wp.price);
                        isWholesale = true;
                        break;
                    }
                }
            }

            const newItem: CartItem = {
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                quantity: overrideQuantity,
                unit_price: price,
                discount_percent: 0,
                discount_amount: 0,
                tax_percent: 0,
                tax_amount: 0,
                subtotal: price * overrideQuantity,
                total: price * overrideQuantity,
                is_wholesale: isWholesale,
                wholesale_info_string: wholesaleInfoString,
            };
            setCart([...cart, newItem]);
            setShowPriceModal(false);
            setSelectedProductForPrice(null);
        }
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter((item) => item.product_id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(
            cart.map((item) => {
                if (item.product_id !== productId) return item;

                const product = products.find((p: any) => p.id === productId);
                let currentUnitPrice = item.unit_price;
                let isWholesale = item.is_wholesale || false;

                if (product) {
                    let basePrice = Number(product.selling_price) || 0;
                    isWholesale = false;
                    
                    if (product.wholesale_prices && product.wholesale_prices.length > 0) {
                        const sortedWholesale = [...product.wholesale_prices].sort((a, b) => b.min_qty - a.min_qty);
                        for (const wp of sortedWholesale) {
                            if (quantity >= wp.min_qty) {
                                basePrice = Number(wp.price);
                                isWholesale = true;
                                break;
                            }
                        }
                    }
                    currentUnitPrice = basePrice;
                }

                const lineTotal = currentUnitPrice * quantity;
                const discountAmount = lineTotal * (item.discount_percent / 100);
                const afterDiscount = lineTotal - discountAmount;
                const taxAmount = afterDiscount * (item.tax_percent / 100);
                const itemTotal = afterDiscount + taxAmount;

                return {
                    ...item,
                    quantity,
                    unit_price: currentUnitPrice,
                    is_wholesale: isWholesale,
                    subtotal: lineTotal,
                    discount_amount: discountAmount,
                    tax_amount: taxAmount,
                    total: itemTotal,
                };
            })
        );
    };

    const updateItemDiscount = (productId: string, discountPercent: number) => {
        setCart(
            cart.map((item) => {
                if (item.product_id !== productId) return item;

                const lineTotal = item.unit_price * item.quantity;
                const discountAmount = lineTotal * (discountPercent / 100);
                const afterDiscount = lineTotal - discountAmount;
                const taxAmount = afterDiscount * (item.tax_percent / 100);
                const itemTotal = afterDiscount + taxAmount;

                return {
                    ...item,
                    discount_percent: discountPercent,
                    discount_amount: discountAmount,
                    tax_amount: taxAmount,
                    total: itemTotal,
                };
            })
        );
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const totalDiscount = cart.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
    const totalTax = cart.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const totalAmount = subtotal - totalDiscount + totalTax + (extraCharge || 0);
    
    let calculatedPaidAmount = paidAmount;
    if (paymentMethod === 'split') {
        calculatedPaidAmount = (cashAmount || 0) + (transferAmount || 0);
    }
    const changeAmount = calculatedPaidAmount - totalAmount;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/pos', {
            search,
            category: selectedCategory,
        }, {
            preserveState: true,
        });
    };

    const handleProcessSale = async () => {
        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }

        if (calculatedPaidAmount < totalAmount) {
            alert('Insufficient payment amount');
            return;
        }

        const saleData = {
            branch_id: branch?.id,
            customer_id: selectedCustomer || null,
            number: saleNumber,
            date: new Date().toISOString().split('T')[0],
            status: 'paid',
            subtotal,
            tax_amount: totalTax,
            discount_amount: totalDiscount,
            extra_charge_amount: extraCharge,
            total_amount: totalAmount,
            paid_amount: calculatedPaidAmount,
            cash_amount: paymentMethod === 'split' ? cashAmount : (paymentMethod === 'cash' ? calculatedPaidAmount : 0),
            transfer_amount: paymentMethod === 'split' ? transferAmount : (paymentMethod === 'transfer' ? calculatedPaidAmount : 0),
            change_amount: changeAmount,
            payment_method: paymentMethod,
            notes: '',
            items: cart.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_percent: item.discount_percent,
                discount_amount: item.discount_amount,
                tax_percent: item.tax_percent,
                tax_amount: item.tax_amount,
                subtotal: item.subtotal,
                total: item.total,
                notes: '',
            })),
        };

        try {
            const response = await fetch('/pos/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(saleData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success('Pesanan berhasil diselesaikan!');
                setLastSale(result.sale);
                setShowReceipt(true);
                setCart([]);
                setPaidAmount(0);
                setCashAmount(0);
                setTransferAmount(0);
                setExtraCharge(0);
                setSelectedCustomer('');
            } else {
                let errorMsg = result.message || 'Gagal memproses pesanan';
                if (result.errors) {
                    const firstError = Object.values(result.errors)[0] as string[];
                    if (firstError && firstError.length > 0) {
                        errorMsg += ': ' + firstError[0];
                    }
                }
                toast.error(errorMsg);
            }
        } catch (error: any) {
            toast.error('Error saat memproses pesanan: ' + (error.message || 'Gangguan jaringan'));
        }
    };

    const handleNewSale = () => {
        setShowReceipt(false);
        setLastSale(null);
        router.reload();
    };

    return (
        <>
            <Head title="Point of Sale" />
            <div className="flex h-screen overflow-hidden bg-background text-foreground">
                {/* Left Panel - Products */}
                <div className="flex-1 flex flex-col border-r border-border">
                    <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Kasir</h1>
                                <p className="text-muted-foreground text-sm">Pilih produk dan proses transaksi</p>
                            </div>
                            <Link href="/dashboard">
                                <Button variant="outline" size="sm" className="rounded-full shadow-sm hover:shadow-md transition-all">
                                    <X className="h-4 w-4 mr-2" />
                                    Close POS
                                </Button>
                            </Link>
                        </div>

                        <form onSubmit={handleSearch} className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari produk berdasarkan nama atau SKU..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-11 bg-background/50 focus-visible:ring-primary shadow-sm"
                                />
                            </div>
                            <Select value={selectedCategory || 'all'} onValueChange={(value) => setSelectedCategory(value === 'all' ? '' : value)}>
                                <SelectTrigger className="h-11 w-48">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {categories.map((cat: any) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="submit" className="h-11 px-6 shadow-md hover:shadow-lg transition-all">
                                Cari
                            </Button>
                        </form>
                    </div>

                    <div className="flex-1 overflow-auto p-6 bg-muted/20">
                        {products.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium">Tidak ada produk ditemukan</p>
                                <p className="text-sm">Coba sesuaikan pencarian atau filter kategori</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {products.map((product: any) => {
                                    const isOutOfStock = product.current_stock <= 0;
                                    const isLowStock = !isOutOfStock && product.current_stock <= (product.reorder_point || 0);

                                    return (
                                        <Card
                                            key={product.id}
                                            className={`group overflow-hidden shadow-sm transition-all duration-200 ${
                                                isOutOfStock ? 'opacity-60 cursor-not-allowed bg-muted/30 grayscale-[50%] border-border/50' : 
                                                isLowStock ? 'cursor-pointer border-destructive/50 hover:border-destructive hover:shadow-lg' :
                                                'cursor-pointer border-border/50 hover:border-primary/50 hover:shadow-lg'
                                            }`}
                                            onClick={() => {
                                                if (isOutOfStock) {
                                                    toast.error('Stok produk habis!');
                                                    return;
                                                }
                                                addToCart(product);
                                            }}
                                        >
                                            <div className="aspect-square bg-muted relative overflow-hidden flex items-center justify-center">
                                                <div className={`w-full h-full bg-gradient-to-br flex items-center justify-center ${
                                                    isLowStock ? 'from-destructive/20 to-destructive/5' : 'from-primary/20 to-primary/5'
                                                }`}>
                                                    <span className={`text-3xl font-bold ${isLowStock ? 'text-destructive/60' : 'text-primary/60'}`}>
                                                        {product.name?.charAt(0).toUpperCase() || 'P'}
                                                    </span>
                                                </div>
                                                {/* Status indicator */}
                                                {isOutOfStock ? (
                                                    <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground px-2 py-1 text-[10px] font-bold rounded shadow-md">
                                                        Habis
                                                    </div>
                                                ) : isLowStock ? (
                                                    <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground px-2 py-1 text-[10px] font-bold rounded shadow-md">
                                                        Sisa {product.current_stock}
                                                    </div>
                                                ) : (
                                                    <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
                                                        <Plus className="h-3 w-3" />
                                                    </div>
                                                )}
                                            </div>
                                            <CardContent className="p-3 space-y-2 bg-card">
                                                <h3 className={`font-semibold text-sm line-clamp-1 leading-tight ${
                                                    isOutOfStock ? 'text-muted-foreground' : 
                                                    isLowStock ? 'text-destructive' : ''
                                                }`} title={product.name}>{product.name}</h3>
                                                <p className="text-[10px] text-muted-foreground truncate">{product.sku}</p>
                                                <div className="flex items-center justify-between pt-1">
                                                    <p className={`text-sm font-bold ${
                                                        isOutOfStock ? 'text-muted-foreground' : 
                                                        isLowStock ? 'text-destructive' : 'text-primary'
                                                    }`}>Rp {formatIDR(product.selling_price)}</p>
                                                    <p className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                                                        isOutOfStock ? 'bg-destructive/10 text-destructive' : 
                                                        isLowStock ? 'bg-destructive text-destructive-foreground' : 'bg-muted/80 text-muted-foreground'
                                                    }`}>Stok: {product.current_stock}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Cart */}
                <div className="w-[420px] flex flex-col bg-card border-l border-border shadow-2xl z-10">
                    <div className="p-5 border-b border-border bg-card/80 backdrop-blur-sm">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Pesanan Saat Ini
                            <span className="ml-auto bg-primary/10 text-primary font-bold text-xs px-3 py-1.5 rounded-full">
                                {cart.length} {cart.length === 1 ? 'item' : 'item'}
                            </span>
                        </h2>
                    </div>

                    <div className="flex-1 overflow-auto p-3 space-y-2 bg-muted/10">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-3">
                                    <ShoppingCart className="h-8 w-8 opacity-20" />
                                </div>
                                <p className="text-sm font-medium text-foreground">Keranjang Anda kosong</p>
                                <p className="text-xs mt-1">Pilih produk dari panel kiri</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <Card key={item.product_id} className="border-border/40 shadow-sm overflow-hidden hover:border-primary/40 transition-all duration-200">
                                    <div className="p-2.5">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-xs leading-tight truncate">{item.product_name}</p>
                                                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{item.product_sku}</p>
                                                {item.wholesale_info_string && (
                                                    <p className="text-[9px] text-green-600 dark:text-green-400 mt-0.5 font-medium leading-tight">Grosir: {item.wholesale_info_string}</p>
                                                )}
                                                {item.is_wholesale && (
                                                    <span className="inline-block mt-1 bg-green-500/10 text-green-600 border border-green-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                        Harga Grosir Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 transition-colors"
                                                onClick={() => removeFromCart(item.product_id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-0.5 bg-background rounded-md p-0.5 border border-border/60">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 rounded hover:bg-muted"
                                                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.product_id, parseFloat(e.target.value))}
                                                    className="h-7 w-14 text-center text-xs border-0 bg-transparent px-1 font-bold focus-visible:ring-0"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 rounded hover:bg-muted"
                                                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-semibold text-muted-foreground">Rp {formatIDR(item.unit_price)}</p>
                                                <p className="text-sm font-bold text-primary">Rp {formatIDR(item.total)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    <div className="border-t border-border bg-card p-4 space-y-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)] relative">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="font-medium text-foreground">Rp {formatIDR(subtotal)}</span>
                            </div>
                            {totalDiscount > 0 && (
                                <div className="flex justify-between text-xs text-destructive">
                                    <span>Discount</span>
                                    <span className="font-medium">-Rp {formatIDR(totalDiscount)}</span>
                                </div>
                            )}
                            {totalTax > 0 && (
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Tax</span>
                                    <span className="font-medium text-foreground">Rp {formatIDR(totalTax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t border-border border-dashed">
                                <span>Biaya Tambahan</span>
                                <div className="relative w-24">
                                    <Input
                                        type="number"
                                        min="0"
                                        value={extraCharge === 0 ? '' : extraCharge}
                                        onChange={(e) => setExtraCharge(parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                        className="h-6 text-right text-xs bg-transparent border-border/50 pr-1 pl-1"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-end pt-2 mt-2 border-t border-border border-dashed">
                                <span className="text-sm font-medium">Total Harga</span>
                                <span className="text-xl font-black text-primary tracking-tight">Rp {formatIDR(totalAmount)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pelanggan</Label>
                                <Select value={selectedCustomer || 'walk-in'} onValueChange={(value) => setSelectedCustomer(value === 'walk-in' ? '' : value)}>
                                    <SelectTrigger className="h-9 w-full">
                                        <SelectValue placeholder="Walk-in Customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="walk-in">Pelanggan Langsung</SelectItem>
                                        {customers.map((customer: any) => (
                                            <SelectItem key={customer.id} value={customer.id}>
                                                {customer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Metode Pembayaran</Label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                        { id: 'cash', icon: DollarSign, label: 'Tunai' },
                                        { id: 'card', icon: CreditCard, label: 'Kartu' },
                                        { id: 'transfer', icon: DollarSign, label: 'Transfer' },
                                        { id: 'e_wallet', icon: DollarSign, label: 'E-Wallet' },
                                        { id: 'split', icon: CreditCard, label: 'Split' },
                                    ].map((method) => {
                                        const Icon = method.icon;
                                        const isActive = paymentMethod === method.id;
                                        return (
                                            <Button
                                                key={method.id}
                                                type="button"
                                                variant={isActive ? 'default' : 'outline'}
                                                className={`h-12 flex flex-col items-center justify-center gap-1 transition-all duration-200 ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-card shadow-sm' : 'hover:bg-muted border-border/60'}`}
                                                onClick={() => setPaymentMethod(method.id)}
                                            >
                                                <Icon className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                                <span className="text-[9px] font-bold tracking-wide">{method.label}</span>
                                            </Button>
                                        )
                                    })}
                                </div>
                            </div>

                            {paymentMethod === 'split' ? (
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jumlah Tunai</Label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-muted-foreground font-bold group-focus-within:text-primary transition-colors text-xs">Rp</span>
                                            </div>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={cashAmount || ''}
                                                onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="pl-9 h-10 text-sm font-bold bg-background/50 focus-visible:ring-primary shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jumlah Transfer</Label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-muted-foreground font-bold group-focus-within:text-primary transition-colors text-xs">Rp</span>
                                            </div>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={transferAmount || ''}
                                                onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="pl-9 h-10 text-sm font-bold bg-background/50 focus-visible:ring-primary shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs"
                                        onClick={() => { setCashAmount(totalAmount); setTransferAmount(0); }}
                                    >
                                        Isi Tunai Penuh
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jumlah Dibayar</Label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-muted-foreground font-bold group-focus-within:text-primary transition-colors text-xs">Rp</span>
                                        </div>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={paidAmount || ''}
                                            onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                            className="pl-9 h-10 text-sm font-bold bg-background/50 focus-visible:ring-primary shadow-inner"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs"
                                        onClick={() => setPaidAmount(totalAmount)}
                                    >
                                        Bayar Jumlah Tepat (Rp {formatIDR(totalAmount)})
                                    </Button>
                                </div>
                            )}
                        </div>

                        {calculatedPaidAmount > 0 && changeAmount >= 0 && (
                            <div className="flex justify-between items-center p-2 bg-green-500/10 rounded-md border border-green-500/20">
                                <span className="font-medium text-green-600 dark:text-green-400 text-xs">Kembalian</span>
                                <span className="text-sm font-black text-green-600 dark:text-green-400">Rp {formatIDR(changeAmount)}</span>
                            </div>
                        )}
                        {calculatedPaidAmount > 0 && changeAmount < 0 && (
                            <div className="flex justify-between items-center p-2 bg-destructive/10 rounded-md border border-destructive/20">
                                <span className="font-medium text-destructive text-xs">Kurang</span>
                                <span className="text-sm font-black text-destructive">Rp {formatIDR(Math.abs(changeAmount))}</span>
                            </div>
                        )}

                        <Button
                            onClick={handleProcessSale}
                            disabled={cart.length === 0 || calculatedPaidAmount < totalAmount}
                            className="w-full h-14 text-lg font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:hover:scale-100 disabled:opacity-50 mt-2"
                        >
                            Selesaikan Pesanan (Rp {formatIDR(totalAmount)})
                        </Button>
                    </div>
                </div>

                {/* Receipt Dialog */}
                <Dialog open={showReceipt} onOpenChange={(open) => {
                    if (!open) handleNewSale();
                }}>
                    <DialogContent 
                        onInteractOutside={(e) => e.preventDefault()}
                        className="max-w-md bg-transparent border-none shadow-none print:shadow-none print:bg-white print:max-w-full print:top-0 print:left-0 print:translate-x-0 print:translate-y-0 print:p-0 print:m-0 print:border-none print:absolute"
                    >
                        {lastSale && (
                            <div className="bg-white print:text-black p-6 rounded-lg shadow-sm w-full max-w-sm mx-auto font-sans print-area print:p-0 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible">
                                <DialogHeader className="sr-only">
                                    <DialogTitle>Receipt</DialogTitle>
                                </DialogHeader>
                                <div className="text-center space-y-1">
                                    <h3 className="text-base font-black tracking-tight">{auth.user.store_name || branch?.name || 'Toko Paylo'}</h3>
                                    <p className="text-[10px] text-muted-foreground mt-1">{new Date().toLocaleString()}</p>
                                </div>

                                <div className="flex items-center justify-between border-y border-border/50 border-dashed py-2 my-3">
                                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">No Penjualan</span>
                                    <span className="text-xs font-bold font-mono">{lastSale.number}</span>
                                </div>

                                <div className="space-y-2 mb-3">
                                    {lastSale.items.map((item: any) => {
                                        let wholesaleInfo = '';
                                        if (item.product?.wholesale_prices && item.product.wholesale_prices.length > 0) {
                                            const sorted = [...item.product.wholesale_prices].sort((a: any, b: any) => a.min_qty - b.min_qty);
                                            wholesaleInfo = sorted.map((wp: any) => `≥${wp.min_qty}: Rp${formatIDR(wp.price)}`).join(' | ');
                                        }

                                        return (
                                            <div key={item.id} className="flex justify-between items-start text-xs">
                                                <div className="pr-4">
                                                    <p className="font-semibold leading-tight">{item.product.name}</p>
                                                    {wholesaleInfo && (
                                                        <p className="text-[8px] text-muted-foreground mt-0.5 leading-tight">Grosir: {wholesaleInfo}</p>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground">{item.quantity} x Rp {formatIDR(item.unit_price - item.discount_amount/item.quantity)}</p>
                                                </div>
                                                <span className="font-bold whitespace-nowrap">Rp {formatIDR(item.total)}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="border-t border-border/50 border-dashed pt-3 space-y-1.5">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>Rp {formatIDR(lastSale.subtotal)}</span>
                                    </div>
                                    {lastSale.discount_amount > 0 && (
                                        <div className="flex justify-between text-xs text-destructive">
                                            <span>Diskon</span>
                                            <span>-Rp {formatIDR(lastSale.discount_amount)}</span>
                                        </div>
                                    )}
                                    {lastSale.tax_amount > 0 && (
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Pajak</span>
                                            <span>Rp {formatIDR(lastSale.tax_amount)}</span>
                                        </div>
                                    )}
                                    {lastSale.extra_charge_amount > 0 && (
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Biaya Tambahan</span>
                                            <span>Rp {formatIDR(lastSale.extra_charge_amount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-black text-sm pt-1.5 pb-1.5">
                                        <span>Total</span>
                                        <span>Rp {formatIDR(lastSale.total_amount)}</span>
                                    </div>
                                    {lastSale.payment_method === 'split' ? (
                                        <>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Tunai</span>
                                                <span className="font-medium">Rp {formatIDR(lastSale.cash_amount)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Transfer</span>
                                                <span className="font-medium">Rp {formatIDR(lastSale.transfer_amount)}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Dibayar ({lastSale.payment_method})</span>
                                            <span className="font-medium">Rp {formatIDR(lastSale.paid_amount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Kembalian</span>
                                        <span className="font-bold">Rp {formatIDR(lastSale.change_amount)}</span>
                                    </div>
                                </div>

                                <div className="text-center mt-5 pt-3 border-t border-border/50 border-dashed">
                                    <p className="text-xs font-bold">Terima Kasih!</p>
                                    <p className="text-[10px] text-muted-foreground">Silakan datang kembali</p>
                                    <div className="mt-3 flex justify-center items-center gap-1">
                                        <span className="text-[10px] text-muted-foreground">Powered by</span>
                                        <span className="text-[10px] font-black tracking-tighter">PAYLO</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6 print:hidden">
                                    <Button onClick={handleNewSale} className="flex-1" variant="default">
                                        Penjualan Baru
                                    </Button>
                                    <Button variant="outline" onClick={() => window.print()} className="flex-1 border-primary text-primary hover:bg-primary/5">
                                        <Printer className="mr-2 h-4 w-4" />
                                        Cetak
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Price Selection Modal */}
                <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="text-center">Pilih Varian Harga</DialogTitle>
                        </DialogHeader>
                        {selectedProductForPrice && (
                            <div className="space-y-3">
                                <Button className="w-full justify-between h-12" variant="outline" onClick={() => addToCart(selectedProductForPrice, Number(selectedProductForPrice.selling_price), 1)}>
                                    <span>Eceran / Satuan (1 Pcs)</span>
                                    <span className="font-bold">Rp {formatIDR(Number(selectedProductForPrice.selling_price))}</span>
                                </Button>
                                {selectedProductForPrice.prices.map((price: any) => (
                                    <Button key={price.id} className="w-full justify-between h-12" variant="outline" onClick={() => addToCart(selectedProductForPrice, Number(price.price) / price.quantity, price.quantity)}>
                                        <span>{price.name} ({price.quantity} Pcs)</span>
                                        <span className="font-bold">Rp {formatIDR(Number(price.price))}</span>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
