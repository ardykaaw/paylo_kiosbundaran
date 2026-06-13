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

    // Resizing states
    const [cartWidth, setCartWidth] = useState(420);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 300 && newWidth <= Math.min(800, window.innerWidth - 300)) {
                setCartWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
            }
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        };
    }, [isDragging]);

    // Format currency for Indonesian Rupiah (no decimal places)

    const formatNumberInput = (val: number | string) => {
        if (!val && val !== 0) return '';
        const num = Number(val.toString().replace(/\D/g, ''));
        return num === 0 && val.toString() !== '0' ? '' : num.toLocaleString('id-ID');
    };
    const parseNumberInput = (val: string) => {
        return Number(val.replace(/\D/g, '')) || 0;
    };

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
                                            <div className="flex items-center gap-2">
                                                {cat.color && <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />}
                                                {cat.name}
                                            </div>
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
                                            className={`group overflow-hidden shadow-sm transition-all duration-200 ${isOutOfStock ? 'opacity-60 cursor-not-allowed bg-muted/30 grayscale-[50%] border-border/50' :
                                                isLowStock ? 'cursor-pointer border-destructive/50 hover:border-destructive hover:shadow-lg' :
                                                    'cursor-pointer border-border/50 hover:border-primary/50 hover:shadow-lg'
                                                }`}
                                            style={{ borderTopWidth: product.category?.color ? '4px' : undefined, borderTopColor: product.category?.color || undefined }}
                                            onClick={() => {
                                                if (isOutOfStock) {
                                                    toast.error('Stok produk habis!');
                                                    return;
                                                }
                                                addToCart(product);
                                            }}
                                        >
                                            <div className="aspect-square bg-muted relative overflow-hidden flex items-center justify-center">
                                                <div className={`w-full h-full bg-gradient-to-br flex items-center justify-center ${isLowStock ? 'from-destructive/20 to-destructive/5' : 'from-primary/20 to-primary/5'
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
                                                        <Plus className="h-8 w-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <CardContent className="p-3 space-y-2 bg-card">
                                                <h3 className={`font-semibold text-sm line-clamp-1 leading-tight ${isOutOfStock ? 'text-muted-foreground' :
                                                    isLowStock ? 'text-destructive' : ''
                                                    }`} title={product.name}>{product.name}</h3>
                                                <div className="flex items-center gap-1.5">
                                                    {product.category?.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: product.category.color }} />}
                                                    <p className="text-[10px] text-muted-foreground truncate">{product.category?.name || product.sku}</p>
                                                </div>
                                                <div className="flex items-center justify-between pt-1">
                                                    <p className={`text-sm font-bold ${isOutOfStock ? 'text-muted-foreground' :
                                                        isLowStock ? 'text-destructive' : 'text-primary'
                                                        }`}>Rp {formatIDR(product.selling_price)}</p>
                                                    <p className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${isOutOfStock ? 'bg-destructive/10 text-destructive' :
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
                <div
                    className="flex flex-col h-full overflow-hidden bg-card border-l border-border shadow-2xl z-10 relative transition-all duration-0"
                    style={{ width: `${cartWidth}px`, minWidth: '300px' }}
                >
                    {/* Resizer Handle */}
                    <div
                        className="absolute top-0 bottom-0 left-0 w-3 -ml-[6px] cursor-col-resize z-50 hover:bg-primary/50 active:bg-primary/80 group flex items-center justify-center transition-colors"
                        onMouseDown={() => setIsDragging(true)}
                    >
                        <div className={`h-12 w-1 rounded-full bg-primary/30 group-hover:bg-primary/80 ${isDragging ? 'bg-primary' : ''}`} />
                    </div>
                    <div className="p-3 border-b border-border bg-card/80 backdrop-blur-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold flex items-center gap-1.5">
                                <ShoppingCart className="h-4 w-4 text-primary" />
                                Pesanan Saat Ini
                            </h2>
                            <span className="bg-primary/10 text-primary font-bold text-[10px] px-2 py-0.5 rounded-full">
                                {cart.length} item
                            </span>
                        </div>
                        <Select value={selectedCustomer || 'walk-in'} onValueChange={(value) => setSelectedCustomer(value === 'walk-in' ? '' : value)}>
                            <SelectTrigger className="h-7 w-full text-xs">
                                <SelectValue placeholder="Walk-in Customer" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="walk-in">Pelanggan Langsung</SelectItem>
                                {customers.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                                <p className="font-bold text-4xl leading-tight truncate">{item.product_name}</p>
                                                <p className="text-2xl uppercase tracking-wider text-muted-foreground mt-0.5">{item.product_sku}</p>
                                                {item.wholesale_info_string && (
                                                    <p className="text-sm text-green-600 dark:text-green-400 mt-0.5 font-medium leading-tight">Grosir: {item.wholesale_info_string}</p>
                                                )}
                                                {item.is_wholesale && (
                                                    <span className="inline-block mt-1 bg-green-500/10 text-green-600 border border-green-500/20 text-xs font-bold px-1.5 py-0.5 rounded">
                                                        Harga Grosir Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-16 w-16 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 transition-colors"
                                                onClick={() => removeFromCart(item.product_id)}
                                            >
                                                <Trash2 className="h-8 w-8" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-0.5 bg-background rounded-md p-0.5 border border-border/60">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-16 w-16 rounded hover:bg-muted"
                                                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                                >
                                                    <Minus className="h-8 w-8" />
                                                </Button>
                                                <Input
                                                    type="text"
                                                    value={formatNumberInput(item.quantity)}
                                                    onChange={(e) => updateQuantity(item.product_id, parseNumberInput(e.target.value))}
                                                    className="h-16 w-32 text-center text-3xl border-0 bg-transparent px-1 font-extrabold focus-visible:ring-0"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-16 w-16 rounded hover:bg-muted"
                                                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                >
                                                    <Plus className="h-8 w-8" />
                                                </Button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-semibold text-muted-foreground">Rp {formatIDR(item.unit_price)}</p>
                                                <p className="text-4xl font-bold text-primary">Rp {formatIDR(item.total)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    <div className="border-t border-border bg-card p-2 space-y-2 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)] relative">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-base text-muted-foreground">
                                <div className="flex gap-3">
                                    <span>Sub: <span className="text-foreground font-semibold">Rp {formatIDR(subtotal)}</span></span>
                                    {totalDiscount > 0 && <span className="text-destructive font-semibold">Disc: -Rp {formatIDR(totalDiscount)}</span>}
                                    {totalTax > 0 && <span className="font-semibold">Tax: Rp {formatIDR(totalTax)}</span>}
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-border border-dashed">
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-semibold text-muted-foreground">Biaya Tambahan:</span>
                                    <div className="relative w-20">
                                        <Input type="text" value={extraCharge === 0 ? '' : formatNumberInput(extraCharge)} onChange={(e) => setExtraCharge(parseNumberInput(e.target.value) || 0)} placeholder="0" className="h-10 text-right text-lg font-semibold bg-transparent border-border/50 pr-2 pl-2" />
                                    </div>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-xl font-bold text-muted-foreground mb-1">Total</span>
                                    <span className="text-4xl font-black text-primary tracking-tight leading-none">Rp {formatIDR(totalAmount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">


                            <div className="space-y-2">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Metode Pembayaran</Label>
                                <div className="grid grid-cols-5 gap-1">
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
                                                className={`h-12 flex flex-row items-center justify-center gap-1.5 transition-all duration-200 ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-card shadow-sm' : 'hover:bg-muted border-border/60'}`}
                                                onClick={() => setPaymentMethod(method.id)}
                                            >
                                                <Icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                                <span className="text-sm font-bold tracking-wide">{method.label}</span>
                                            </Button>
                                        )
                                    })}
                                </div>
                            </div>

                            {paymentMethod === 'split' ? (
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Jumlah Tunai</Label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-muted-foreground font-bold group-focus-within:text-primary transition-colors text-base">Rp</span>
                                            </div>
                                            <Input
                                                type="text"
                                                value={cashAmount ? formatNumberInput(cashAmount) : ''}
                                                onChange={(e) => setCashAmount(parseNumberInput(e.target.value))}
                                                placeholder="0"
                                                className="pl-10 h-12 text-lg font-bold bg-background/50 focus-visible:ring-primary shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Jumlah Transfer</Label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-muted-foreground font-bold group-focus-within:text-primary transition-colors text-base">Rp</span>
                                            </div>
                                            <Input
                                                type="text"
                                                value={transferAmount ? formatNumberInput(transferAmount) : ''}
                                                onChange={(e) => setTransferAmount(parseNumberInput(e.target.value))}
                                                placeholder="0"
                                                className="pl-10 h-12 text-lg font-bold bg-background/50 focus-visible:ring-primary shadow-inner"
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
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 relative group">
                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                            <span className="text-muted-foreground font-bold group-focus-within:text-primary transition-colors text-base">Rp</span>
                                        </div>
                                        <Input type="text" value={formatNumberInput(paidAmount)} onChange={(e) => setPaidAmount(parseNumberInput(e.target.value))} placeholder="0" className="pl-10 h-12 text-lg font-bold bg-background/50 focus-visible:ring-primary shadow-inner"
                                        />
                                    </div>
                                    <Button type="button" variant="outline" className="h-12 text-sm px-4" onClick={() => setPaidAmount(totalAmount)}>
                                        Uang Pas
                                    </Button>
                                </div>
                            )}
                        </div>

                        {calculatedPaidAmount > 0 && changeAmount >= 0 && (
                            <div className="flex justify-between items-center p-3 px-4 bg-green-500/10 rounded-md border border-green-500/20">
                                <span className="font-bold text-green-600 dark:text-green-400 text-xl">Kembalian</span>
                                <span className="text-3xl font-black text-green-600 dark:text-green-400">Rp {formatIDR(changeAmount)}</span>
                            </div>
                        )}
                        {calculatedPaidAmount > 0 && changeAmount < 0 && (
                            <div className="flex justify-between items-center p-3 px-4 bg-destructive/10 rounded-md border border-destructive/20">
                                <span className="font-bold text-destructive text-xl">Kurang</span>
                                <span className="text-3xl font-black text-destructive">Rp {formatIDR(Math.abs(changeAmount))}</span>
                            </div>
                        )}

                        <Button
                            onClick={handleProcessSale}
                            disabled={cart.length === 0 || calculatedPaidAmount < totalAmount}
                            className="w-full h-14 text-xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:hover:scale-100 disabled:opacity-50 mt-1"
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

                                <div className="font-mono text-xs text-black pb-4">
                                    {/* Header */}
                                    <div className="text-center font-bold text-sm mb-2 uppercase">
                                        {auth.user.store_name || branch?.name || 'TOKO FADILLAH'}
                                    </div>
                                    <div className="mb-2">
                                        <p>JL. SAMRATULANGI (Bundaran Mandonga)</p>
                                        <p>Telp: 082236013446</p>
                                    </div>

                                    {/* Meta Info */}
                                    <div className="mb-2">
                                        <div className="flex justify-between">
                                            <span>No.  : {lastSale.number}</span>
                                            <span>{new Date(lastSale.created_at || new Date()).toLocaleDateString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Kasir: {auth.user.name || 'ADMIN'}</span>
                                            <span>{new Date(lastSale.created_at || new Date()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        </div>
                                        <p>Pel. : {lastSale.customer ? lastSale.customer.name : 'UMUM'}</p>
                                    </div>

                                    <div className="border-t border-dashed border-black my-1"></div>

                                    {/* Items */}
                                    <div className="mb-2">
                                        {lastSale.items.map((item: any) => (
                                            <div key={item.id} className="mb-1">
                                                <p>{item.product.name}</p>
                                                <div className="flex justify-between">
                                                    <span>{formatIDR(item.unit_price)} x {item.quantity} {item.product.unit || 'PCS'}x =</span>
                                                    <span>{formatIDR(item.total)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-dashed border-black my-1"></div>

                                    {/* Totals */}
                                    <div className="mb-2">
                                        <div className="flex justify-between">
                                            <span>Subtotal =</span>
                                            <span>{formatIDR(lastSale.subtotal)}</span>
                                        </div>
                                        {lastSale.extra_charge_amount > 0 && (
                                            <div className="flex justify-between">
                                                <span>Biaya Lain =</span>
                                                <span>{formatIDR(lastSale.extra_charge_amount)}</span>
                                            </div>
                                        )}
                                        {lastSale.discount_amount > 0 && (
                                            <div className="flex justify-between">
                                                <span>Diskon =</span>
                                                <span>-{formatIDR(lastSale.discount_amount)}</span>
                                            </div>
                                        )}
                                        {lastSale.tax_amount > 0 && (
                                            <div className="flex justify-between">
                                                <span>Pajak =</span>
                                                <span>{formatIDR(lastSale.tax_amount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Total Akhir =</span>
                                            <span>{formatIDR(lastSale.total_amount)}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-dashed border-black my-1"></div>

                                    {/* Payments */}
                                    <div className="mb-2">
                                        {lastSale.payment_method === 'split' ? (
                                            <>
                                                <div className="flex justify-between">
                                                    <span>Tunai      =</span>
                                                    <span>{formatIDR(lastSale.cash_amount)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Transfer   =</span>
                                                    <span>{formatIDR(lastSale.transfer_amount)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex justify-between">
                                                <span className="capitalize">{lastSale.payment_method === 'cash' ? 'Tunai' : (lastSale.payment_method === 'transfer' ? 'Transfer' : lastSale.payment_method)} =</span>
                                                <span>{formatIDR(lastSale.paid_amount)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-dashed border-black my-1"></div>

                                    <div className="flex justify-between mb-4">
                                        <span>Kembali    =</span>
                                        <span>{formatIDR(lastSale.change_amount)}</span>
                                    </div>

                                    {/* Footer */}
                                    <div className="text-center mt-6">
                                        <p>Terima Kasih.</p>
                                        <div className="mt-3 flex justify-center items-center gap-1 text-black">
                                            <span className="text-[10px]">Powered by</span>
                                            <span className="text-[10px] font-black tracking-tighter">PAYLO</span>
                                        </div>
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
