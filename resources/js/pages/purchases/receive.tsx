import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle } from 'lucide-react';


    const formatNumberInput = (val: number | string) => {
        if (val === null || val === undefined || val === '') return '';
        const num = Number(val.toString().replace(/\D/g, ''));
        return num === 0 && val.toString() !== '0' ? '' : num.toLocaleString('id-ID');
    };
    const parseNumberInput = (val: string) => {
        return Number(val.replace(/\D/g, '')) || 0;
    };

export default function PurchaseReceive() {
    const { props } = usePage();
    const { purchase } = props as any;

    const { data, setData, post, processing, errors } = useForm({
        items: purchase.items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            received_quantity: item.received_quantity,
        })),
    });

    const updateReceivedQuantity = (index: number, value: number) => {
        const updatedItems = [...data.items];
        updatedItems[index].received_quantity = value;
        setData('items', updatedItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/purchases/${purchase.id}/receive`, {
            onSuccess: () => {},
        });
    };

    return (
        <>
            <Head title={`Receive Purchase ${purchase.number}`} />
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={`/purchases/${purchase.id}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Receive Purchase</h1>
                        <p className="text-muted-foreground">{purchase.number} - {purchase.supplier?.name}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Purchase Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Branch</p>
                                <p className="font-medium">{purchase.branch?.name || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Date</p>
                                <p className="font-medium">{new Date(purchase.date).toLocaleDateString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="font-medium">Rp {purchase.total_amount.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Receive Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {data.items.map((item: any, index: number) => {
                                const purchaseItem = purchase.items.find((pi: any) => pi.id === item.id);
                                return (
                                    <Card key={item.id}>
                                        <CardContent className="p-4">
                                            <div className="grid gap-4 md:grid-cols-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm text-muted-foreground">Product</p>
                                                    <p className="font-medium">{purchaseItem?.product?.name || '-'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-muted-foreground">Ordered Quantity</p>
                                                    <p className="font-medium">{item.quantity}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`received-${index}`}>Received Quantity *</Label>
                                                    <Input
                                                        id={`received-${index}`}
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max={item.quantity}
                                                        value={item.received_quantity}
                                                        onChange={(e) => updateReceivedQuantity(index, parseFloat(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-muted-foreground">Status</p>
                                                    {item.received_quantity >= item.quantity ? (
                                                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Fully Received
                                                        </span>
                                                    ) : item.received_quantity > 0 ? (
                                                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            Partially Received
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                                                            Not Received
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            <div className="flex justify-end gap-4">
                                <Link href={`/purchases/${purchase.id}`}>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Receiving...' : 'Receive Stock'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
