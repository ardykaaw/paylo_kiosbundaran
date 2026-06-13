import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

export default function BranchIndex() {
    const { props } = usePage();
    const { branches, filters } = props as any;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        router.get('/branches', {
            search: formData.get('search'),
            per_page: filters.per_page || 10,
        }, {
            preserveState: true,
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this branch?')) {
            router.delete(`/branches/${id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Branches" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
                        <p className="text-muted-foreground">Manage your branch locations</p>
                    </div>
                    <Link href="/branches/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Branch
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
                                    placeholder="Search branches..."
                                    defaultValue={filters.search || ''}
                                />
                            </div>
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
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Code</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Manager</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Phone</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Main</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branches.data.map((branch: any) => (
                                        <tr key={branch.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">{branch.code}</td>
                                            <td className="p-4 align-middle">{branch.name}</td>
                                            <td className="p-4 align-middle">{branch.manager?.name || '-'}</td>
                                            <td className="p-4 align-middle">{branch.phone || '-'}</td>
                                            <td className="p-4 align-middle">
                                                {branch.is_main && (
                                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                                                        Main
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${branch.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {branch.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/branches/${branch.id}/edit`}>
                                                        <Button size="sm" variant="outline">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button size="sm" variant="outline" onClick={() => handleDelete(branch.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
                        Showing {branches.from} to {branches.to} of {branches.total} results
                    </div>
                    <div className="flex gap-2">
                        {branches.links.map((link: any, index: number) => (
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
