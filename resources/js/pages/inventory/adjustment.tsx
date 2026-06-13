import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';


    const formatNumberInput = (val: number | string) => {
        if (val === null || val === undefined || val === '') return '';
        const num = Number(val.toString().replace(/\D/g, ''));
        return num === 0 && val.toString() !== '0' ? '' : num.toLocaleString('id-ID');
    };
    const parseNumberInput = (val: string) => {
        return Number(val.replace(/\D/g, '')) || 0;
    };

export default function StockAdjustment() {
    const { props } = usePage();
    const { product } = props as any;

    const { data, setData, post, processing, errors } = useForm({
        new_quantity: product.current_stock,
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/inventory/adjustment/${product.id}`, {
            onSuccess: () => {},
        });
    };

    return (
        <>
            <Head title="Stock Adjustment" />
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/inventory">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Stock Adjustment</h1>
                        <p className="text-muted-foreground">Adjust stock for {product.name}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Current Stock Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Product</p>
                                <p className="font-medium">{product.name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">SKU</p>
                                <p className="font-medium">{product.sku}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Current Stock</p>
                                <p className="font-medium text-2xl">{product.current_stock}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Adjust Stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="new_quantity">New Quantity *</Label>
                                <Input
                                    id="new_quantity"
                                    type="number"
                                    step="0.01"
                                    value={data.new_quantity}
                                    onChange={(e) => setData('new_quantity', parseFloat(e.target.value))}
                                    min="0"
                                />
                                {errors.new_quantity && <p className="text-sm text-red-600">{errors.new_quantity}</p>}
                                <p className="text-sm text-muted-foreground">
                                    Difference: {(data.new_quantity - product.current_stock).toFixed(2)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="Reason for adjustment..."
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-4">
                                <Link href="/inventory">
                                    <Button type="button" variant="outline">Cancel</Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Adjusting...' : 'Adjust Stock'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
