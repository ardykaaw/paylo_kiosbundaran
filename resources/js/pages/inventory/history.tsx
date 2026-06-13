import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, TrendingDown, History } from 'lucide-react';

export default function StockHistory() {
    const { props } = usePage();
    const { product, movements } = props as any;

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
            <Head title="Stock History" />
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/inventory">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Stock History</h1>
                        <p className="text-muted-foreground">History for {product.name}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Product Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">SKU</p>
                                <p className="font-medium">{product.sku}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Category</p>
                                <p className="font-medium">{product.category?.name || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Current Stock</p>
                                <p className="font-medium text-2xl">{product.current_stock}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Unit</p>
                                <p className="font-medium">{product.unit}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Movement History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Quantity</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Before</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">After</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Branch</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">By</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.data.map((movement: any) => {
                                        const Icon = getMovementIcon(movement.movement_type);
                                        return (
                                            <tr key={movement.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">{new Date(movement.created_at).toLocaleString()}</td>
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
                                                <td className="p-4 align-middle">{movement.notes || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

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
