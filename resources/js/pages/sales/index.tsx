import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Eye, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SalesIndex() {
    const { props } = usePage();
    const { sales, filters } = props as any;

    const formatIDR = (value: number) => {
        return Math.round(value).toLocaleString('id-ID');
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const status = formData.get('status');
        router.get('/sales', {
            search: formData.get('search'),
            status: status === 'all' ? '' : status,
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
        }, {
            preserveState: true,
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'returned':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft':
                return 'Draft';
            case 'pending':
                return 'Pending';
            case 'paid':
                return 'Dibayar';
            case 'cancelled':
                return 'Dibatalkan';
            case 'returned':
                return 'Dikembalikan';
            default:
                return status;
        }
    };

    return (
        <>
            <Head title="Riwayat Penjualan" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Riwayat Penjualan</h1>
                        <p className="text-muted-foreground">Lihat semua transaksi penjualan</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Cari & Filter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <Input
                                    name="search"
                                    placeholder="Cari nomor penjualan atau pelanggan..."
                                    defaultValue={filters.search || ''}
                                />
                            </div>
                            <Select name="status" defaultValue={filters.status || 'all'}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="paid">Dibayar</SelectItem>
                                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                    <SelectItem value="returned">Dikembalikan</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                name="start_date"
                                type="date"
                                defaultValue={filters.start_date || ''}
                                className="w-[150px]"
                            />
                            <Input
                                name="end_date"
                                type="date"
                                defaultValue={filters.end_date || ''}
                                className="w-[150px]"
                            />
                            <Button type="submit">
                                <Search className="mr-2 h-4 w-4" />
                                Cari
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
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nomor</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tanggal</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Pelanggan</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cabang</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.data.map((sale: any) => (
                                        <tr key={sale.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">{sale.number}</td>
                                            <td className="p-4 align-middle">
                                                {new Date(sale.created_at || sale.date).toLocaleString('id-ID', {
                                                    timeZone: 'Asia/Makassar',
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                }).replace(/\./g, ':')} WITA
                                            </td>
                                            <td className="p-4 align-middle">{sale.customer?.name || 'Pelanggan Langsung'}</td>
                                            <td className="p-4 align-middle">{sale.branch?.name || '-'}</td>
                                            <td className="p-4 align-middle">Rp {formatIDR(sale.total_amount)}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(sale.status)}`}>
                                                    {getStatusLabel(sale.status)}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/sales/${sale.id}`}>
                                                        <Button size="sm" variant="outline">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
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
                        Menampilkan {sales.from} sampai {sales.to} dari {sales.total} hasil
                    </div>
                    <div className="flex gap-2">
                        {sales.links.map((link: any, index: number) => (
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
