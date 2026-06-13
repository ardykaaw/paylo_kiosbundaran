import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Printer, User, Building2, Calendar, DollarSign } from 'lucide-react';

export default function SalesShow() {
    const { props } = usePage();
    const { sale } = props as any;

    const formatIDR = (value: number) => {
        return Math.round(value).toLocaleString('id-ID');
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
            <Head title={`Detail Penjualan #${sale.number}`} />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/sales">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Detail Penjualan #{sale.number}</h1>
                            <p className="text-muted-foreground">Lihat detail transaksi penjualan</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tanggal</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">
                                {new Date(sale.created_at || sale.date).toLocaleString('id-ID', {
                                    timeZone: 'Asia/Makassar',
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                }).replace(/\./g, ':')} WITA
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(sale.status)}`}>
                                {getStatusLabel(sale.status)}
                            </span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rp {formatIDR(sale.total_amount)}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Informasi Pelanggan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nama:</span>
                                <span className="font-medium">{sale.customer?.name || 'Pelanggan Langsung'}</span>
                            </div>
                            {sale.customer && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-medium">{sale.customer.email || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Telepon:</span>
                                        <span className="font-medium">{sale.customer.phone || '-'}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Informasi Cabang
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nama Cabang:</span>
                                <span className="font-medium">{sale.branch?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Alamat:</span>
                                <span className="font-medium">{sale.branch?.address || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Dibuat Oleh:</span>
                                <span className="font-medium">{sale.created_by?.name || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Item Penjualan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Produk</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">SKU</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Jumlah</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Harga Satuan</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Diskon</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.items.map((item: any) => (
                                        <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">{item.product?.name || '-'}</td>
                                            <td className="p-4 align-middle">{item.product?.sku || '-'}</td>
                                            <td className="p-4 align-middle text-right">{item.quantity}</td>
                                            <td className="p-4 align-middle text-right">Rp {formatIDR(item.unit_price)}</td>
                                            <td className="p-4 align-middle text-right">
                                                {item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}
                                            </td>
                                            <td className="p-4 align-middle text-right font-medium">Rp {formatIDR(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ringkasan Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">Rp {formatIDR(sale.subtotal)}</span>
                        </div>
                        {sale.discount_amount > 0 && (
                            <div className="flex justify-between text-sm text-destructive">
                                <span>Diskon</span>
                                <span className="font-medium">-Rp {formatIDR(sale.discount_amount)}</span>
                            </div>
                        )}
                        {sale.tax_amount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Pajak</span>
                                <span className="font-medium">Rp {formatIDR(sale.tax_amount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold pt-3 border-t">
                            <span>Total</span>
                            <span>Rp {formatIDR(sale.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Metode Pembayaran</span>
                            <span className="font-medium capitalize">{sale.payment_method}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Jumlah Dibayar</span>
                            <span className="font-medium">Rp {formatIDR(sale.paid_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Kembalian</span>
                            <span className="font-medium">Rp {formatIDR(sale.change_amount)}</span>
                        </div>
                    </CardContent>
                </Card>

                {sale.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Catatan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{sale.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
