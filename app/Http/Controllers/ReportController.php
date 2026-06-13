<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ReportController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:reports.view', only: ['index']),
        ];
    }
    /**
     * Display the reports dashboard.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $tenant = $user->tenant;

        if (!$tenant) {
            return Inertia::render('reports/index', [
                'metrics' => [],
                'recentSales' => [],
                'topProducts' => [],
            ]);
        }

        // Metrics
        $todaySales = $tenant->sales()->whereDate('date', today())->sum('total_amount');
        $monthSales = $tenant->sales()->whereMonth('date', today()->month)
                                      ->whereYear('date', today()->year)
                                      ->sum('total_amount');
        
        $todayTransactions = $tenant->sales()->whereDate('date', today())->count();
        $monthTransactions = $tenant->sales()->whereMonth('date', today()->month)
                                             ->whereYear('date', today()->year)
                                             ->count();

        // Recent Sales
        $recentSales = $tenant->sales()
            ->with(['customer', 'branch'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Top Selling Products this month
        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.tenant_id', $tenant->id)
            ->whereMonth('sales.date', today()->month)
            ->whereYear('sales.date', today()->year)
            ->select('products.name', 'products.sku', DB::raw('SUM(sale_items.quantity) as total_sold'), DB::raw('SUM(sale_items.total) as total_revenue'))
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderByDesc('total_sold')
            ->take(5)
            ->get();

        return Inertia::render('reports/index', [
            'metrics' => [
                'todaySales' => $todaySales,
                'monthSales' => $monthSales,
                'todayTransactions' => $todayTransactions,
                'monthTransactions' => $monthTransactions,
            ],
            'recentSales' => $recentSales,
            'topProducts' => $topProducts,
        ]);
    }
}
