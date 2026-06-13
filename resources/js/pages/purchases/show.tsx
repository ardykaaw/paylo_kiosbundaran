import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pencil, Trash2, Package, CheckCircle } from 'lucide-react';

export default function PurchaseShow() {
    const { props } = usePage();
    const { purchase } = props as any;

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this purchase?')) {
            router.delete(`/purchases/${purchase.id}`, {
                preserveScroll: true,
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'received':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            <Head title={`Purchase ${purchase.number}`} />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/purchases">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{purchase.number}</h1>
                            <p className="text-muted-foreground">Purchase order details</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {purchase.status === 'draft' || purchase.status === 'pending' ? (
                            <>
                                <Link href={`/purchases/${purchase.id}/edit`}>
                                    <Button variant="outline">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                </Link>
                                <Button variant="outline" onClick={handleDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                                {purchase.status === 'pending' && (
                                    <Link href={`/purchases/${purchase.id}/receive`}>
                                        <Button>
                                            <Package className="mr-2 h-4 w-4" />
                                            Receive Stock
                                        </Button>
                                    </Link>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Supplier</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">{purchase.supplier?.name || '-'}</p>
                            <p className="text-sm text-muted-foreground">{purchase.supplier?.phone || '-'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Branch</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">{purchase.branch?.name || '-'}</p>
                            <p className="text-sm text-muted-foreground">{purchase.branch?.address || '-'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(purchase.status)}`}>
                                {purchase.status}
                            </span>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Purchase Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Date</p>
                                <p className="font-medium">{new Date(purchase.date).toLocaleDateString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Due Date</p>
                                <p className="font-medium">{purchase.due_date ? new Date(purchase.due_date).toLocaleDateString() : '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Created By</p>
                                <p className="font-medium">{purchase.created_by?.name || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Received At</p>
                                <p className="font-medium">{purchase.received_at ? new Date(purchase.received_at).toLocaleString() : '-'}</p>
                            </div>
                        </div>
                        {purchase.notes && (
                            <div className="mt-4 space-y-1">
                                <p className="text-sm text-muted-foreground">Notes</p>
                                <p className="font-medium">{purchase.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Items</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Quantity</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Unit Price</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Discount</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tax</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Received</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchase.items.map((item: any) => (
                                        <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">{item.product?.name || '-'}</td>
                                            <td className="p-4 align-middle">{item.quantity}</td>
                                            <td className="p-4 align-middle">Rp {item.unit_price.toLocaleString()}</td>
                                            <td className="p-4 align-middle">Rp {item.discount_amount.toLocaleString()}</td>
                                            <td className="p-4 align-middle">Rp {item.tax_amount.toLocaleString()}</td>
                                            <td className="p-4 align-middle">Rp {item.total.toLocaleString()}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.received_quantity >= item.quantity ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {item.received_quantity} / {item.quantity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="grid gap-4 md:grid-cols-4 text-lg">
                            <div>
                                <p className="text-muted-foreground">Subtotal</p>
                                <p className="font-medium">Rp {purchase.subtotal.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Discount</p>
                                <p className="font-medium">Rp {purchase.discount_amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Tax</p>
                                <p className="font-medium">Rp {purchase.tax_amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className="font-bold text-xl">Rp {purchase.total_amount.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
