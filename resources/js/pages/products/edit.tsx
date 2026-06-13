import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';


    const formatNumberInput = (val: number | string) => {
        if (!val && val !== 0) return '';
        const num = Number(val.toString().replace(/\D/g, ''));
        return num === 0 && val.toString() !== '0' ? '' : num.toLocaleString('id-ID');
    };
    const parseNumberInput = (val: string) => {
        return Number(val.replace(/\D/g, '')) || 0;
    };

export default function ProductEdit() {
    const { props } = usePage();
    const { product, categories } = props as any;

    const { data, setData, put, processing, errors } = useForm({
        category_id: product.category_id || '',
        sku: product.sku,
        barcode: product.barcode || '',
        name: product.name,
        description: product.description || '',
        unit: product.unit,
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        wholesale_prices: product.wholesale_prices || [],
        min_stock: product.min_stock,
        max_stock: product.max_stock,
        reorder_point: product.reorder_point,
        current_stock: product.current_stock,
        image_path: product.image_path || '',
        is_active: product.is_active,
        is_track_stock: product.is_track_stock,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/products/${product.id}`, {
            onSuccess: () => {},
        });
    };

    return (
        <>
            <Head title="Edit Produk" />
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/products">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Produk</h1>
                        <p className="text-muted-foreground">Perbarui informasi produk</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Produk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU *</Label>
                                    <Input
                                        id="sku"
                                        value={data.sku}
                                        onChange={(e) => setData('sku', e.target.value)}
                                    />
                                    {errors.sku && <p className="text-sm text-red-600">{errors.sku}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="barcode">Barcode</Label>
                                    <Input
                                        id="barcode"
                                        value={data.barcode}
                                        onChange={(e) => setData('barcode', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Produk *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category_id">Kategori</Label>
                                <Select value={data.category_id} onValueChange={(value) => setData('category_id', value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat: any) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="unit">Satuan *</Label>
                                    <Input
                                        id="unit"
                                        value={data.unit}
                                        onChange={(e) => setData('unit', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cost_price">Harga Modal *</Label>
                                    <Input id="cost_price" type="text" value={formatNumberInput(data.cost_price)} onChange={(e) => setData('cost_price', parseNumberInput(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="selling_price">Harga Jual *</Label>
                                    <Input id="selling_price" type="text" value={formatNumberInput(data.selling_price)} onChange={(e) => setData('selling_price', parseNumberInput(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base">Harga Grosir</Label>
                                        <p className="text-sm text-muted-foreground">Opsional: Tambahkan tingkat harga diskon grosir</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newWholesale = [...data.wholesale_prices, { min_qty: 2, price: 0 }];
                                            setData('wholesale_prices', newWholesale);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tambah Tingkatan
                                    </Button>
                                </div>

                                {data.wholesale_prices.length > 0 && (
                                    <div className="space-y-3">
                                        {data.wholesale_prices.map((wp: any, index: number) => (
                                            <div key={index} className="flex items-end gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                                                <div className="space-y-2 flex-1">
                                                    <Label>Min. Kuantitas</Label>
                                                    <Input
                                                        type="text"
                                                        value={formatNumberInput(wp.min_qty)}
                                                        onChange={(e) => {
                                                            const newWholesale = [...data.wholesale_prices];
                                                            newWholesale[index].min_qty = parseNumberInput(e.target.value) || 2;
                                                            setData('wholesale_prices', newWholesale);
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    <Label>Harga Grosir</Label>
                                                    <Input
                                                        type="text"
                                                        value={formatNumberInput(wp.price)}
                                                        onChange={(e) => {
                                                            const newWholesale = [...data.wholesale_prices];
                                                            newWholesale[index].price = parseNumberInput(e.target.value) || 0;
                                                            setData('wholesale_prices', newWholesale);
                                                        }}
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => {
                                                        const newWholesale = data.wholesale_prices.filter((_, i) => i !== index);
                                                        setData('wholesale_prices', newWholesale);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-3 pt-4 border-t border-border/50">
                                <div className="space-y-2">
                                    <Label htmlFor="min_stock">Stok Minimum *</Label>
                                    <Input id="min_stock" type="text" value={formatNumberInput(data.min_stock)} onChange={(e) => setData('min_stock', parseNumberInput(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max_stock">Stok Maksimum *</Label>
                                    <Input id="max_stock" type="text" value={formatNumberInput(data.max_stock)} onChange={(e) => setData('max_stock', parseNumberInput(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reorder_point">Batas Restok *</Label>
                                    <Input id="reorder_point" type="text" value={formatNumberInput(data.reorder_point)} onChange={(e) => setData('reorder_point', parseNumberInput(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="current_stock">Stok Saat Ini *</Label>
                                    <Input id="current_stock" type="text" value={formatNumberInput(data.current_stock)} onChange={(e) => setData('current_stock', parseNumberInput(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="image_path">Path Gambar</Label>
                                    <Input
                                        id="image_path"
                                        value={data.image_path}
                                        onChange={(e) => setData('image_path', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                    />
                                    <Label htmlFor="is_active">Aktif</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_track_stock"
                                        checked={data.is_track_stock}
                                        onCheckedChange={(checked) => setData('is_track_stock', checked as boolean)}
                                    />
                                    <Label htmlFor="is_track_stock">Lacak Stok</Label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4">
                                <Link href="/products">
                                    <Button type="button" variant="outline">Batal</Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Memperbarui...' : 'Perbarui Produk'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
