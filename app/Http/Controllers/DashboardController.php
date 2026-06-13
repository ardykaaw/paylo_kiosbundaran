<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $tenant = $user->tenant;
        $roleModel = $user->roles()->first();
        $role = $roleModel ? $roleModel->name : 'karyawan';

        if (!$tenant) {
            return Inertia::render('dashboard', [
                'metrics' => [],
                'chartData' => [],
                'userRole' => $role,
            ]);
        }

        $isManager = in_array($role, ['owner', 'manager']);
        $metrics = [];
        $chartData = [];

        if ($isManager) {
            $metrics = [
                'totalProducts' => $tenant->products()->where('is_active', true)->count(),
                'totalCustomers' => $tenant->customers()->where('is_active', true)->count(),
                'totalSuppliers' => $tenant->suppliers()->where('is_active', true)->count(),
                'totalUsers' => $tenant->users()->where('status', 'active')->count(),
                'totalBranches' => $tenant->branches()->where('is_active', true)->count(),
                'lowStockProducts' => $tenant->products()
                    ->where('is_active', true)
                    ->whereColumn('current_stock', '<=', 'min_stock')
                    ->where('min_stock', '>', 0)
                    ->count(),
                'todayTransactions' => $tenant->sales()
                    ->whereDate('date', today())
                    ->count(),
                'todayAttendance' => $tenant->attendances()
                    ->whereDate('date', today())
                    ->whereIn('status', ['present', 'late'])
                    ->count(),
            ];

            // 30 days revenue chart
            $thirtyDaysAgo = now()->subDays(29)->startOfDay();
            $sales = $tenant->sales()
                ->where('date', '>=', $thirtyDaysAgo)
                ->selectRaw('DATE(date) as day, sum(total_amount) as total')
                ->groupBy('day')
                ->orderBy('day')
                ->get();

            for ($i = 29; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $sale = $sales->firstWhere('day', $date);
                $chartData[] = [
                    'date' => now()->subDays($i)->format('M d'),
                    'revenue' => $sale ? (float) $sale->total : 0,
                ];
            }
        } elseif ($role === 'kasir') {
            $today = today();
            $metrics = [
                'todayTransactions' => $tenant->sales()->whereDate('date', $today)->count(),
                'todayRevenue' => (float) $tenant->sales()->whereDate('date', $today)->sum('total_amount'),
                'avgTransaction' => 0,
            ];
            
            if ($metrics['todayTransactions'] > 0) {
                $metrics['avgTransaction'] = $metrics['todayRevenue'] / $metrics['todayTransactions'];
            }

            // Sales per hour today
            $salesPerHour = $tenant->sales()
                ->whereDate('date', $today)
                ->get()
                ->groupBy(function ($sale) {
                    return $sale->created_at->format('G');
                })
                ->map(function ($group, $hour) {
                    return (object)[
                        'hour' => (int) $hour,
                        'total' => $group->sum('total_amount')
                    ];
                });
            
            for ($i = 8; $i <= 22; $i++) {
                $sale = $salesPerHour->firstWhere('hour', $i);
                $chartData[] = [
                    'hour' => str_pad($i, 2, '0', STR_PAD_LEFT) . ':00',
                    'revenue' => $sale ? (float) $sale->total : 0,
                ];
            }
        } elseif ($role === 'gudang') {
            $metrics = [
                'totalProducts' => $tenant->products()->where('is_active', true)->count(),
                'lowStockProducts' => $tenant->products()
                    ->where('is_active', true)
                    ->whereColumn('current_stock', '<=', 'min_stock')
                    ->where('min_stock', '>', 0)
                    ->count(),
                'outOfStockProducts' => $tenant->products()->where('is_active', true)->where('current_stock', '<=', 0)->count(),
                'totalSuppliers' => $tenant->suppliers()->where('is_active', true)->count(),
            ];

            $goodStock = $metrics['totalProducts'] - $metrics['lowStockProducts'] - $metrics['outOfStockProducts'];
            $chartData = [
                ['name' => 'Stok Aman', 'value' => max(0, $goodStock), 'fill' => '#22c55e'],
                ['name' => 'Stok Menipis', 'value' => $metrics['lowStockProducts'], 'fill' => '#eab308'],
                ['name' => 'Stok Habis', 'value' => $metrics['outOfStockProducts'], 'fill' => '#ef4444'],
            ];
        } else {
            // Karyawan
            $monthStart = now()->startOfMonth();
            $attendances = $tenant->attendances()
                ->where('user_id', $user->id)
                ->where('date', '>=', $monthStart)
                ->get();

            $metrics = [
                'present' => $attendances->where('status', 'present')->count(),
                'late' => $attendances->where('status', 'late')->count(),
                'sick' => $attendances->where('status', 'sick')->count(),
                'permission' => $attendances->where('status', 'permission')->count(),
            ];

            $chartData = [
                ['name' => 'Hadir', 'value' => $metrics['present'], 'fill' => '#22c55e'],
                ['name' => 'Terlambat', 'value' => $metrics['late'], 'fill' => '#eab308'],
                ['name' => 'Sakit', 'value' => $metrics['sick'], 'fill' => '#ef4444'],
                ['name' => 'Izin', 'value' => $metrics['permission'], 'fill' => '#3b82f6'],
            ];
        }

        return Inertia::render('dashboard', [
            'metrics' => $metrics,
            'chartData' => $chartData,
            'userRole' => $role,
        ]);
    }
}
