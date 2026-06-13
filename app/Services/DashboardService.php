<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;

class DashboardService
{
    /**
     * Get owner dashboard metrics
     */
    public function getOwnerMetrics(): array
    {
        $tenantId = auth()->user()->tenant_id;
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        return [
            // Revenue metrics
            'revenue' => [
                'today' => Sale::where('tenant_id', $tenantId)
                    ->where('date', $today)
                    ->where('status', 'completed')
                    ->sum('total_amount'),
                'thisMonth' => Sale::where('tenant_id', $tenantId)
                    ->where('date', '>=', $thisMonth)
                    ->where('status', 'completed')
                    ->sum('total_amount'),
                'lastMonth' => Sale::where('tenant_id', $tenantId)
                    ->where('date', '>=', $lastMonth)
                    ->where('date', '<', $thisMonth)
                    ->where('status', 'completed')
                    ->sum('total_amount'),
                'growth' => $this->calculateRevenueGrowth($tenantId, $thisMonth, $lastMonth),
            ],

            // Best selling products
            'bestSellingProducts' => SaleItem::whereHas('sale', function ($query) use ($tenantId) {
                $query->where('tenant_id', $tenantId)->where('status', 'completed');
            })
                ->select('product_id', \DB::raw('SUM(quantity) as total_sold'), \DB::raw('SUM(total) as total_revenue'))
                ->with('product')
                ->groupBy('product_id')
                ->orderBy('total_sold', 'desc')
                ->limit(10)
                ->get(),

            // Low stock products
            'lowStockProducts' => Product::where('tenant_id', $tenantId)
                ->where('is_active', true)
                ->where('is_track_stock', true)
                ->whereColumn('current_stock', '<=', 'min_stock')
                ->where('min_stock', '>', 0)
                ->with('category')
                ->orderBy('current_stock')
                ->limit(10)
                ->get(),

            // Active branches
            'activeBranches' => Branch::where('tenant_id', $tenantId)
                ->where('is_active', true)
                ->count(),

            // Active users
            'activeUsers' => User::where('tenant_id', $tenantId)
                ->where('status', 'active')
                ->count(),

            // Today's attendance
            'todayAttendance' => [
                'total' => Attendance::where('tenant_id', $tenantId)
                    ->where('date', $today)
                    ->count(),
                'present' => Attendance::where('tenant_id', $tenantId)
                    ->where('date', $today)
                    ->where('status', 'present')
                    ->count(),
                'late' => Attendance::where('tenant_id', $tenantId)
                    ->where('date', $today)
                    ->where('status', 'late')
                    ->count(),
                'permission' => Attendance::where('tenant_id', $tenantId)
                    ->where('date', $today)
                    ->where('status', 'permission')
                    ->count(),
                'sick' => Attendance::where('tenant_id', $tenantId)
                    ->where('date', $today)
                    ->where('status', 'sick')
                    ->count(),
            ],

            // Revenue chart data (last 7 days)
            'revenueChart' => $this->getRevenueChartData($tenantId, 7),

            // Sales chart data (last 7 days)
            'salesChart' => $this->getSalesChartData($tenantId, 7),
        ];
    }

    /**
     * Calculate revenue growth percentage
     */
    protected function calculateRevenueGrowth(int $tenantId, Carbon $thisMonth, Carbon $lastMonth): float
    {
        $thisMonthRevenue = Sale::where('tenant_id', $tenantId)
            ->where('date', '>=', $thisMonth)
            ->where('status', 'completed')
            ->sum('total_amount');

        $lastMonthRevenue = Sale::where('tenant_id', $tenantId)
            ->where('date', '>=', $lastMonth)
            ->where('date', '<', $thisMonth)
            ->where('status', 'completed')
            ->sum('total_amount');

        if ($lastMonthRevenue == 0) {
            return $thisMonthRevenue > 0 ? 100 : 0;
        }

        return (($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100;
    }

    /**
     * Get revenue chart data for last N days
     */
    protected function getRevenueChartData(int $tenantId, int $days): array
    {
        $data = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $revenue = Sale::where('tenant_id', $tenantId)
                ->where('date', $date)
                ->where('status', 'completed')
                ->sum('total_amount');

            $data[] = [
                'date' => $date->format('M d'),
                'revenue' => $revenue,
            ];
        }

        return $data;
    }

    /**
     * Get sales chart data for last N days
     */
    protected function getSalesChartData(int $tenantId, int $days): array
    {
        $data = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $sales = Sale::where('tenant_id', $tenantId)
                ->where('date', $date)
                ->where('status', 'completed')
                ->count();

            $data[] = [
                'date' => $date->format('M d'),
                'sales' => $sales,
            ];
        }

        return $data;
    }
}
