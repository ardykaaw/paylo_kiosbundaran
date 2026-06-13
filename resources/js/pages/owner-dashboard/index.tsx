import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Package, AlertTriangle, Building2, Users, CheckCircle, Clock } from 'lucide-react';

export default function OwnerDashboard() {
    const { props } = usePage();
    const { metrics } = props as any;

    const formatCurrency = (amount: number) => {
        return `Rp ${amount.toLocaleString()}`;
    };

    return (
        <>
            <Head title="Owner Dashboard" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Owner Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your business performance</p>
                </div>

                {/* Revenue Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(metrics.revenue.today)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(metrics.revenue.thisMonth)}</div>
                            <p className={`text-xs ${metrics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {metrics.revenue.growth >= 0 ? '+' : ''}{metrics.revenue.growth.toFixed(1)}% vs last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Last Month</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(metrics.revenue.lastMonth)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Branches</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.activeBranches}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.lowStockProducts.length}</div>
                            <p className="text-xs text-muted-foreground">Products need attention</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.todayAttendance.present + metrics.todayAttendance.late}</div>
                            <p className="text-xs text-muted-foreground">{metrics.todayAttendance.total} total</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Best Selling Products */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Best Selling Products</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {metrics.bestSellingProducts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No sales data yet</p>
                                ) : (
                                    metrics.bestSellingProducts.map((item: any) => (
                                        <div key={item.product_id} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium">{item.product?.name || '-'}</p>
                                                <p className="text-sm text-muted-foreground">{item.total_sold} sold</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{formatCurrency(item.total_revenue)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Low Stock Products */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Low Stock Products</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {metrics.lowStockProducts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">All products have sufficient stock</p>
                                ) : (
                                    metrics.lowStockProducts.map((product: any) => (
                                        <div key={product.id} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">{product.category?.name || '-'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-red-600">{product.current_stock}</p>
                                                <p className="text-xs text-muted-foreground">/ {product.min_stock}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Revenue Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-end gap-2">
                            {metrics.revenueChart.map((data: any, index: number) => {
                                const maxRevenue = Math.max(...metrics.revenueChart.map((d: any) => d.revenue));
                                const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                        <div
                                            className="w-full bg-primary rounded-t"
                                            style={{ height: `${height}%`, minHeight: '4px' }}
                                        />
                                        <p className="text-xs text-muted-foreground">{data.date}</p>
                                        <p className="text-xs font-medium">{formatCurrency(data.revenue)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Today's Attendance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{metrics.todayAttendance.total}</div>
                                <p className="text-sm text-muted-foreground">Total</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">{metrics.todayAttendance.present}</div>
                                <p className="text-sm text-muted-foreground">Present</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-600">{metrics.todayAttendance.late}</div>
                                <p className="text-sm text-muted-foreground">Late</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{metrics.todayAttendance.permission}</div>
                                <p className="text-sm text-muted-foreground">Permission</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-600">{metrics.todayAttendance.sick}</div>
                                <p className="text-sm text-muted-foreground">Sick</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
