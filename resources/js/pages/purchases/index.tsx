import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Search, Eye, Package } from 'lucide-react';

export default function PurchaseIndex() {
    const { props } = usePage();
    const { purchases, suppliers, filters } = props as any;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        router.get('/purchases', {
            search: formData.get('search'),
            status: formData.get('status'),
            supplier: formData.get('supplier'),
            per_page: filters.per_page || 10,
        }, {
            preserveState: true,
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this purchase?')) {
            router.delete(`/purchases/${id}`, {
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
            <Head title="Purchases" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
                        <p className="text-muted-foreground">Manage purchase orders and receipts</p>
                    </div>
                    <Link href="/purchases/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Purchase
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Search & Filter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    name="search"
                                    placeholder="Search by purchase number..."
                                    defaultValue={filters.search || ''}
                                />
                            </div>
                            <select
                                name="status"
                                defaultValue={filters.status || ''}
                                className="flex h-10 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="received">Received</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <select
                                name="supplier"
                                defaultValue={filters.supplier || ''}
                                className="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">All Suppliers</option>
                                {suppliers.map((supplier: any) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                            <Button type="submit">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Number</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Supplier</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Branch</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchases.data.map((purchase: any) => (
                                        <tr key={purchase.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">{purchase.number}</td>
                                            <td className="p-4 align-middle">{new Date(purchase.date).toLocaleDateString()}</td>
                                            <td className="p-4 align-middle">{purchase.supplier?.name || '-'}</td>
                                            <td className="p-4 align-middle">{purchase.branch?.name || '-'}</td>
                                            <td className="p-4 align-middle">Rp {purchase.total_amount.toLocaleString()}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(purchase.status)}`}>
                                                    {purchase.status}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/purchases/${purchase.id}`}>
                                                        <Button size="sm" variant="outline">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    {purchase.status === 'draft' || purchase.status === 'pending' ? (
                                                        <>
                                                            <Link href={`/purchases/${purchase.id}/edit`}>
                                                                <Button size="sm" variant="outline">
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button size="sm" variant="outline" onClick={() => handleDelete(purchase.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {purchases.from} to {purchases.to} of {purchases.total} results
                    </div>
                    <div className="flex gap-2">
                        {purchases.links.map((link: any, index: number) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
