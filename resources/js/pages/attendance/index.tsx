import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, Search, CheckCircle, AlertTriangle, FileText, Heart } from 'lucide-react';

export default function AttendanceIndex() {
    const { props } = usePage();
    const { attendances, todayAttendance, isOwner, filters } = props as any;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        router.get('/attendance', {
            search: formData.get('search'),
            status: formData.get('status'),
            date_from: formData.get('date_from'),
            date_to: formData.get('date_to'),
            per_page: filters.per_page || 10,
        }, {
            preserveState: true,
        });
    };

    const handleClockIn = () => {
        router.post('/attendance/clock-in', {}, {
            preserveScroll: true,
        });
    };

    const handleClockOut = () => {
        router.post('/attendance/clock-out', {}, {
            preserveScroll: true,
        });
    };

    const handleLeaveRequest = (status: string) => {
        const date = prompt('Masukkan tanggal (YYYY-MM-DD):');
        if (date) {
            const notes = prompt('Masukkan catatan (opsional):');
            router.post('/attendance/request-leave', {
                date,
                status,
                notes,
            }, {
                preserveScroll: true,
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present':
                return 'bg-green-100 text-green-800';
            case 'late':
                return 'bg-yellow-100 text-yellow-800';
            case 'permission':
                return 'bg-blue-100 text-blue-800';
            case 'sick':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'present':
                return CheckCircle;
            case 'late':
                return AlertTriangle;
            case 'permission':
                return FileText;
            case 'sick':
                return Heart;
            default:
                return Calendar;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'present':
                return 'Hadir';
            case 'late':
                return 'Terlambat';
            case 'permission':
                return 'Izin';
            case 'sick':
                return 'Sakit';
            default:
                return status;
        }
    };

    return (
        <>
            <Head title="Absensi" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Absensi</h1>
                        <p className="text-muted-foreground">Kelola data absensi Anda</p>
                    </div>
                </div>

                {/* Today's Status - Only for non-owners */}
                {!isOwner && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Absensi Hari Ini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {todayAttendance ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const Icon = getStatusIcon(todayAttendance.status);
                                                return <Icon className="h-5 w-5" />;
                                            })()}
                                            <span className="font-semibold">{getStatusLabel(todayAttendance.status)}</span>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(todayAttendance.status)}`}>
                                            {todayAttendance.status}
                                        </span>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Masuk</p>
                                            <p className="font-medium">
                                                {todayAttendance.check_in_time ? new Date(todayAttendance.check_in_time).toLocaleTimeString() : '-'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Keluar</p>
                                            <p className="font-medium">
                                                {todayAttendance.check_out_time ? new Date(todayAttendance.check_out_time).toLocaleTimeString() : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    {todayAttendance.check_out_time ? null : (
                                        <Button onClick={handleClockOut} className="w-full">
                                            <Clock className="mr-2 h-4 w-4" />
                                            Keluar
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-muted-foreground">Tidak ada data absensi hari ini</p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button onClick={handleClockIn} className="flex-1">
                                            <Clock className="mr-2 h-4 w-4" />
                                            Masuk
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleLeaveRequest('permission')}
                                            className="flex-1"
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            Ajukan Izin
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleLeaveRequest('sick')}
                                            className="flex-1"
                                        >
                                            <Heart className="mr-2 h-4 w-4" />
                                            Lapor Sakit
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Search & Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cari & Filter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        name="search"
                                        className="pl-9"
                                        placeholder={isOwner ? "Cari berdasarkan nama karyawan..." : "Cari..."}
                                        defaultValue={filters.search || ''}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <select
                                        name="status"
                                        defaultValue={filters.status || ''}
                                        className="flex h-10 w-full sm:w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                    >
                                        <option value="">Semua Status</option>
                                        <option value="present">Hadir</option>
                                        <option value="late">Terlambat</option>
                                        <option value="permission">Izin</option>
                                        <option value="sick">Sakit</option>
                                    </select>
                                    <Button type="submit" className="shrink-0">
                                        Cari
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <Input
                                        name="date_from"
                                        type="date"
                                        placeholder="Tanggal Dari"
                                        defaultValue={filters.date_from || ''}
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        name="date_to"
                                        type="date"
                                        placeholder="Tanggal Sampai"
                                        defaultValue={filters.date_to || ''}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Attendance History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Absensi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm min-w-[600px]">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Tanggal</th>
                                        {isOwner && (
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Karyawan</th>
                                        )}
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Masuk</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Keluar</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Status</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendances.data.map((attendance: any) => {
                                        const Icon = getStatusIcon(attendance.status);
                                        return (
                                            <tr key={attendance.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle whitespace-nowrap">{new Date(attendance.date).toLocaleDateString()}</td>
                                                {isOwner && (
                                                    <td className="p-4 align-middle font-medium whitespace-nowrap">{attendance.user?.name || '-'}</td>
                                                )}
                                                <td className="p-4 align-middle whitespace-nowrap">
                                                    {attendance.check_in_time ? new Date(attendance.check_in_time).toLocaleTimeString() : '-'}
                                                </td>
                                                <td className="p-4 align-middle whitespace-nowrap">
                                                    {attendance.check_out_time ? new Date(attendance.check_out_time).toLocaleTimeString() : '-'}
                                                </td>
                                                <td className="p-4 align-middle whitespace-nowrap">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(attendance.status)}`}>
                                                        <Icon className="h-3 w-3 mr-1" />
                                                        {getStatusLabel(attendance.status)}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-middle max-w-[200px] truncate" title={attendance.notes || ''}>{attendance.notes || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                        Menampilkan {attendances.from || 0} sampai {attendances.to || 0} dari {attendances.total || 0} hasil
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {attendances.links.map((link: any, index: number) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
