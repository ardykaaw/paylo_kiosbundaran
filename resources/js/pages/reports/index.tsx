import { Head, usePage } from '@inertiajs/react';
import { DollarSign, Receipt, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils'; // wait, maybe they don't have this. I will define a formatter.

export default function ReportsIndex() {
    const { props } = usePage();
    const { metrics, recentSales, topProducts } = props as any;

    const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    });

    const metricCards = [
        {
            title: 'Penjualan Hari Ini',
            value: formatter.format(metrics?.todaySales || 0),
            icon: DollarSign,
            description: 'Total revenue hari ini',
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950',
        },
        {
            title: 'Penjualan Bulan Ini',
            value: formatter.format(metrics?.monthSales || 0),
            icon: TrendingUp,
            description: 'Total revenue bulan ini',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950',
        },
        {
            title: 'Transaksi Hari Ini',
            value: metrics?.todayTransactions || 0,
            icon: Receipt,
            description: 'Jumlah transaksi sukses',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-950',
        },
        {
            title: 'Transaksi Bulan Ini',
            value: metrics?.monthTransactions || 0,
            icon: ShoppingCart,
            description: 'Jumlah transaksi sukses',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-950',
        },
    ];

    return (
        <>
            <Head title="Laporan" />
            
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Laporan & Analitik</h1>
                    <p className="text-muted-foreground">Ringkasan kinerja bisnis Anda.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {metricCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Card key={card.title}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {card.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-full ${card.bgColor}`}>
                                        <Icon className={`h-4 w-4 ${card.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{card.value}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {card.description}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Produk Terlaris (Bulan Ini)</CardTitle>
                            <CardDescription>Barang yang paling banyak terjual bulan ini.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 text-muted-foreground">
                                            <th className="h-10 px-4 text-left align-middle font-medium">Nama Produk</th>
                                            <th className="h-10 px-4 text-center align-middle font-medium">Terjual</th>
                                            <th className="h-10 px-4 text-right align-middle font-medium">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topProducts && topProducts.length > 0 ? topProducts.map((product: any, idx: number) => (
                                            <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">
                                                    <div className="font-medium">{product.name}</div>
                                                    <div className="text-xs text-muted-foreground">{product.sku}</div>
                                                </td>
                                                <td className="p-4 align-middle text-center font-semibold">
                                                    {Number(product.total_sold)}
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    {formatter.format(product.total_revenue)}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                                    Belum ada data penjualan bulan ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Transaksi Terbaru</CardTitle>
                            <CardDescription>Daftar transaksi penjualan terakhir.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 text-muted-foreground">
                                            <th className="h-10 px-4 text-left align-middle font-medium">No. Ref</th>
                                            <th className="h-10 px-4 text-left align-middle font-medium">Tanggal</th>
                                            <th className="h-10 px-4 text-right align-middle font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentSales && recentSales.length > 0 ? recentSales.map((sale: any, idx: number) => (
                                            <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle font-medium">
                                                    {sale.number}
                                                </td>
                                                <td className="p-4 align-middle text-muted-foreground">
                                                    {new Date(sale.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-4 align-middle text-right font-medium">
                                                    {formatter.format(sale.total_amount)}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                                    Belum ada data transaksi.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
