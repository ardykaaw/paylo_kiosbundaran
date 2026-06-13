import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface PurchaseItem {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    discount_amount: number;
    tax_percent: number;
    tax_amount: number;
    subtotal: number;
    total: number;
    notes: string;
}


    const formatNumberInput = (val: number | string) => {
        if (val === null || val === undefined || val === '') return '';
        const num = Number(val.toString().replace(/\D/g, ''));
        return num === 0 && val.toString() !== '0' ? '' : num.toLocaleString('id-ID');
    };
    const parseNumberInput = (val: string) => {
        return Number(val.replace(/\D/g, '')) || 0;
    };

export default function PurchaseCreate() {
    const { props } = usePage();
    const { branches, suppliers, products, purchaseNumber } = props as any;

    const { data, setData, post, processing, errors } = useForm({
        branch_id: '',
        supplier_id: '',
        number: purchaseNumber,
        date: new Date().toISOString().split('T')[0],
        due_date: '',
        status: 'draft',
        subtotal: 0,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 0,
        paid_amount: 0,
        notes: '',
        items: [] as PurchaseItem[],
    });

    const addItem = () => {
        setData('items', [
            ...data.items,
            {
                product_id: '',
                quantity: 1,
                unit_price: 0,
                discount_percent: 0,
                discount_amount: 0,
                tax_percent: 0,
                tax_amount: 0,
                subtotal: 0,
                total: 0,
                notes: '',
            },
        ]);
    };

    const removeItem = (index: number) => {
        setData('items', data.items.filter((_: any, i: number) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const updatedItems = [...data.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };

        // Recalculate item totals
        const item = updatedItems[index];
        const lineTotal = item.quantity * item.unit_price;
        const discountAmount = lineTotal * (item.discount_percent / 100);
        const afterDiscount = lineTotal - discountAmount;
        const taxAmount = afterDiscount * (item.tax_percent / 100);
        const itemTotal = afterDiscount + taxAmount;

        updatedItems[index] = {
            ...item,
            subtotal: lineTotal,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            total: itemTotal,
        };

        setData('items', updatedItems);

        // Recalculate purchase totals
        const subtotal = updatedItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);
        const totalDiscount = updatedItems.reduce((sum: number, item: any) => sum + item.discount_amount, 0);
        const totalTax = updatedItems.reduce((sum: number, item: any) => sum + item.tax_amount, 0);
        const totalAmount = subtotal - totalDiscount + totalTax;

        setData('subtotal', subtotal);
        setData('discount_amount', totalDiscount);
        setData('tax_amount', totalTax);
        setData('total_amount', totalAmount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/purchases', {
            onSuccess: () => {},
        });
    };

    return (
        <>
            <Head title="Create Purchase" />
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/purchases">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Purchase Order</h1>
                        <p className="text-muted-foreground">Create a new purchase order</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Purchase Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="number">Purchase Number *</Label>
                                    <Input
                                        id="number"
                                        value={data.number}
                                        onChange={(e) => setData('number', e.target.value)}
                                    />
                                    {errors.number && <p className="text-sm text-red-600">{errors.number}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date">Date *</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="branch_id">Branch *</Label>
                                    <select
                                        id="branch_id"
                                        value={data.branch_id}
                                        onChange={(e) => setData('branch_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map((branch: any) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.branch_id && <p className="text-sm text-red-600">{errors.branch_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="supplier_id">Supplier *</Label>
                                    <select
                                        id="supplier_id"
                                        value={data.supplier_id}
                                        onChange={(e) => setData('supplier_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map((supplier: any) => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.supplier_id && <p className="text-sm text-red-600">{errors.supplier_id}</p>}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Items</h3>
                                    <Button type="button" size="sm" onClick={addItem}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Item
                                    </Button>
                                </div>

                                {data.items.map((item: any, index: number) => (
                                    <Card key={index}>
                                        <CardContent className="p-4 space-y-4">
                                            <div className="flex justify-end">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => removeItem(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label>Product *</Label>
                                                    <select
                                                        value={item.product_id}
                                                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    >
                                                        <option value="">Select Product</option>
                                                        {products.map((product: any) => (
                                                            <option key={product.id} value={product.id}>
                                                                {product.name} - {product.sku}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Quantity *</Label>
                                                    <Input type="text" value={formatNumberInput(item.quantity)} onChange={(e) => updateItem(index, 'quantity', parseNumberInput(e.target.value))} />
                                                </div>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="space-y-2">
                                                    <Label>Unit Price *</Label>
                                                    <Input type="text" value={formatNumberInput(item.unit_price)} onChange={(e) => updateItem(index, 'unit_price', parseNumberInput(e.target.value))} />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Discount %</Label>
                                                    <Input type="text" value={formatNumberInput(item.discount_percent)} onChange={(e) => updateItem(index, 'discount_percent', parseNumberInput(e.target.value))} />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Tax %</Label>
                                                    <Input type="text" value={formatNumberInput(item.tax_percent)} onChange={(e) => updateItem(index, 'tax_percent', parseNumberInput(e.target.value))} />
                                                </div>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Subtotal</p>
                                                    <p className="font-medium">Rp {item.subtotal.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Discount</p>
                                                    <p className="font-medium">Rp {item.discount_amount.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Tax</p>
                                                    <p className="font-medium">Rp {item.tax_amount.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Total</p>
                                                    <p className="font-medium">Rp {item.total.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="grid gap-4 md:grid-cols-4 text-lg">
                                        <div>
                                            <p className="text-muted-foreground">Subtotal</p>
                                            <p className="font-medium">Rp {data.subtotal.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Discount</p>
                                            <p className="font-medium">Rp {data.discount_amount.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Tax</p>
                                            <p className="font-medium">Rp {data.tax_amount.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Total</p>
                                            <p className="font-bold text-xl">Rp {data.total_amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-4">
                                <Link href="/purchases">
                                    <Button type="button" variant="outline">Cancel</Button>
                                </Link>
                                <Button type="submit" disabled={processing || data.items.length === 0}>
                                    {processing ? 'Creating...' : 'Create Purchase'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
