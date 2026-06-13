import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Search, TrendingUp, TrendingDown, History, Edit } from 'lucide-react';

export default function InventoryIndex() {
    const { props } = usePage();
    const { movements, lowStockProducts, outOfStockProducts, filters } = props as any;

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const movementType = formData.get('movement_type');
        router.get('/inventory', {
            search: formData.get('search'),
            movement_type: movementType === 'all' ? '' : movementType,
            per_page: filters.per_page || 20,
        }, {
            preserveState: true,
        });
    };

    const getMovementTypeColor = (type: string) => {
        switch (type) {
            case 'in':
            case 'purchase':
                return 'bg-green-100 text-green-800';
            case 'out':
            case 'sale':
                return 'bg-red-100 text-red-800';
            case 'adjustment':
                return 'bg-blue-100 text-blue-800';
            case 'return':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'in':
            case 'purchase':
                return TrendingUp;
            case 'out':
            case 'sale':
                return TrendingDown;
            default:
                return History;
        }
    };

    return (
        <>
            <Head title="Inventory" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                        <p className="text-muted-foreground">Manage stock movements and adjustments</p>
                    </div>
                </div>

                {/* Alerts */}
                {outOfStockProducts.length > 0 && (
                    <Card className="border-red-200 bg-red-50 dark:bg-red-950">
                        <CardHeader>
                            <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Out of Stock ({outOfStockProducts.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {outOfStockProducts.slice(0, 5).map((product: any) => (
                                    <div key={product.id} className="flex items-center justify-between text-sm">
                                        <span>{product.name}</span>
                                        <Link href={`/inventory/adjustment/${product.id}`}>
                                            <Button size="sm" variant="outline">
                                                Adjust
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {lowStockProducts.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                        <CardHeader>
                            <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Low Stock ({lowStockProducts.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {lowStockProducts.slice(0, 5).map((product: any) => (
                                    <div key={product.id} className="flex items-center justify-between text-sm">
                                        <span>{product.name} - {product.current_stock} / {product.min_stock}</span>
                                        <Link href={`/inventory/adjustment/${product.id}`}>
                                            <Button size="sm" variant="outline">
                                                Adjust
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Search & Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search & Filter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    name="search"
                                    placeholder="Search by product name or SKU..."
                                    defaultValue={filters.search || ''}
                                />
                            </div>
                            <Select name="movement_type" defaultValue={filters.movement_type || 'all'}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Semua Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tipe</SelectItem>
                                    <SelectItem value="in">Stock In</SelectItem>
                                    <SelectItem value="out">Stock Out</SelectItem>
                                    <SelectItem value="purchase">Purchase</SelectItem>
                                    <SelectItem value="sale">Sale</SelectItem>
                                    <SelectItem value="adjustment">Adjustment</SelectItem>
                                    <SelectItem value="return">Return</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button type="submit">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Stock Movements */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Stock Movements</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Quantity</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Before</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">After</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Branch</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.data.map((movement: any) => {
                                        const Icon = getMovementIcon(movement.movement_type);
                                        return (
                                            <tr key={movement.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">{formatDate(movement.created_at)}</td>
                                                <td className="p-4 align-middle font-medium">{movement.product?.name || '-'}</td>
                                                <td className="p-4 align-middle">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                                                        <Icon className="h-3 w-3 mr-1" />
                                                        {movement.movement_type}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-middle">{movement.quantity}</td>
                                                <td className="p-4 align-middle">{movement.before_quantity}</td>
                                                <td className="p-4 align-middle">{movement.after_quantity}</td>
                                                <td className="p-4 align-middle">{movement.branch?.name || '-'}</td>
                                                <td className="p-4 align-middle">{movement.created_by?.name || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {movements.from} to {movements.to} of {movements.total} results
                    </div>
                    <div className="flex gap-2">
                        {movements.links.map((link: any, index: number) => (
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
