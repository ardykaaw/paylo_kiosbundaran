import { Head, usePage } from '@inertiajs/react';
import { Package, Users, Truck, UserCog, Building2, AlertTriangle, ShoppingCart, Clock, DollarSign, Activity, Receipt, ArrowUpRight, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                <p className="font-semibold text-foreground mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color || entry.fill }}>
                        {entry.name}: {typeof entry.value === 'number' && entry.name !== 'Terlambat' && entry.name !== 'Sakit' && entry.name !== 'Izin' && entry.name !== 'Hadir' && entry.name !== 'Stok Aman' && entry.name !== 'Stok Menipis' && entry.name !== 'Stok Habis' && !entry.name.includes('Stock') ? 'Rp ' + entry.value.toLocaleString() : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

function OwnerDashboard({ metrics, chartData }: any) {
    const cards = [
        { title: 'Total Revenue', value: 'Rp ' + (chartData.reduce((sum: number, item: any) => sum + item.revenue, 0) || 0).toLocaleString(), icon: DollarSign, color: 'text-green-500' },
        { title: 'Total Produk', value: metrics.totalProducts || 0, icon: Package, color: 'text-blue-500' },
        { title: 'Transaksi Hari Ini', value: metrics.todayTransactions || 0, icon: ShoppingCart, color: 'text-purple-500' },
        { title: 'Absensi Hari Ini', value: metrics.todayAttendance || 0, icon: Clock, color: 'text-orange-500' },
        { title: 'Stok Menipis', value: metrics.lowStockProducts || 0, icon: AlertTriangle, color: 'text-red-500' },
        { title: 'Total Pelanggan', value: metrics.totalCustomers || 0, icon: Users, color: 'text-indigo-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.title}</CardTitle>
                                <Icon className={`h-4 w-4 ${card.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Sales Trend (30 Days)</CardTitle>
                    <CardDescription>Daily revenue performance over the last 30 days.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(value) => `Rp ${(value/1000000).toFixed(1)}M`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

function KasirDashboard({ metrics, chartData }: any) {
    const cards = [
        { title: 'Today\'s Revenue', value: 'Rp ' + (metrics.todayRevenue || 0).toLocaleString(), icon: DollarSign, color: 'text-green-500' },
        { title: 'Transactions Today', value: metrics.todayTransactions || 0, icon: Receipt, color: 'text-blue-500' },
        { title: 'Average Transaction', value: 'Rp ' + (metrics.avgTransaction || 0).toLocaleString(), icon: Activity, color: 'text-purple-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{card.title}</CardTitle>
                                <Icon className={`h-5 w-5 ${card.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black">{card.value}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Hourly Sales (Today)</CardTitle>
                    <CardDescription>Monitor your peak transaction hours for today.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(value) => `Rp ${(value/1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))'}} />
                            <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

function GudangDashboard({ metrics, chartData }: any) {
    const cards = [
        { title: 'Total Products', value: metrics.totalProducts || 0, icon: Package, color: 'text-blue-500' },
        { title: 'Low Stock', value: metrics.lowStockProducts || 0, icon: AlertTriangle, color: 'text-yellow-500' },
        { title: 'Out of Stock', value: metrics.outOfStockProducts || 0, icon: AlertTriangle, color: 'text-red-500' },
        { title: 'Total Suppliers', value: metrics.totalSuppliers || 0, icon: Truck, color: 'text-purple-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{card.title}</CardTitle>
                                <Icon className={`h-5 w-5 ${card.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black">{card.value}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card className="md:w-1/2">
                <CardHeader>
                    <CardTitle>Inventory Health</CardTitle>
                    <CardDescription>Overview of your current stock levels.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

function KaryawanDashboard({ metrics, chartData }: any) {
    const cards = [
        { title: 'Hadir', value: metrics.present || 0, icon: Clock, color: 'text-green-500' },
        { title: 'Terlambat', value: metrics.late || 0, icon: AlertTriangle, color: 'text-yellow-500' },
        { title: 'Sakit', value: metrics.sick || 0, icon: Activity, color: 'text-red-500' },
        { title: 'Izin', value: metrics.permission || 0, icon: FileText, color: 'text-blue-500' },
    ];

    // Workaround removed since it's imported now

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{card.title}</CardTitle>
                                <Icon className={`h-5 w-5 ${card.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black">{card.value}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card className="md:w-1/2">
                <CardHeader>
                    <CardTitle>Attendance Record (This Month)</CardTitle>
                    <CardDescription>Your personal attendance summary.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))'}} />
                            <Bar dataKey="value" name="Days" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}


export default function Dashboard() {
    const { props } = usePage();
    const { metrics, chartData, userRole } = props as any;

    const roleName = (userRole || '').toLowerCase();

    const renderDashboard = () => {
        if (['owner', 'manager'].includes(roleName)) {
            return <OwnerDashboard metrics={metrics} chartData={chartData} />;
        }
        if (roleName === 'kasir') {
            return <KasirDashboard metrics={metrics} chartData={chartData} />;
        }
        if (roleName === 'gudang') {
            return <GudangDashboard metrics={metrics} chartData={chartData} />;
        }
        return <KaryawanDashboard metrics={metrics} chartData={chartData} />;
    };

    const displayRole = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User';

    return (
        <>
            <Head title={`Dashboard - ${displayRole}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-2">
                <div className="mb-2">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
                    <p className="text-muted-foreground">Here is the overview for the <span className="font-semibold text-primary">{displayRole}</span> role.</p>
                </div>
                {renderDashboard()}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
