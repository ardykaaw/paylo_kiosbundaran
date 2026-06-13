<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockAdjustmentRequest;
use App\Models\Product;
use App\Models\StockMovement;
use App\Services\StockService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class StockController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:stock.view', only: ['index', 'history', 'movements']),
            new Middleware('permission:stock.adjust', only: ['adjustment', 'processAdjustment']),
        ];
    }
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Display inventory overview
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $movementType = $request->get('movement_type');
        $perPage = $request->get('per_page', 20);

        $query = StockMovement::where('tenant_id', auth()->user()->tenant_id)
            ->with(['product', 'branch', 'createdBy'])
            ->orderBy('created_at', 'desc');

        if ($search) {
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($movementType) {
            $query->where('movement_type', $movementType);
        }

        $movements = $query->paginate($perPage);

        $lowStockProducts = $this->stockService->getLowStockProducts();
        $outOfStockProducts = $this->stockService->getOutOfStockProducts();

        return Inertia::render('inventory/index', [
            'movements' => $movements,
            'lowStockProducts' => $lowStockProducts,
            'outOfStockProducts' => $outOfStockProducts,
            'filters' => [
                'search' => $search,
                'movement_type' => $movementType,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show stock history for a specific product
     */
    public function history(Request $request, Product $product): Response
    {
        $this->authorizeTenant($product);

        $perPage = $request->get('per_page', 20);
        $movements = $this->stockService->getProductHistory($product->id, $perPage);

        return Inertia::render('inventory/history', [
            'product' => $product,
            'movements' => $movements,
        ]);
    }

    /**
     * Show stock adjustment form
     */
    public function adjustment(Product $product): Response
    {
        $this->authorizeTenant($product);

        return Inertia::render('inventory/adjustment', [
            'product' => $product,
        ]);
    }

    /**
     * Process stock adjustment
     */
    public function processAdjustment(StockAdjustmentRequest $request, Product $product): \Illuminate\Http\RedirectResponse
    {
        $this->authorizeTenant($product);

        $this->stockService->adjustStock(
            $product->id,
            $request->new_quantity,
            $request->notes,
            auth()->user()->branch_id
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Stock adjusted successfully.']);

        return redirect()->route('inventory.index');
    }

    /**
     * Get stock movements by type
     */
    public function movements(Request $request, string $type): Response
    {
        $perPage = $request->get('per_page', 20);
        $movements = $this->stockService->getMovementsByType($type, $perPage);

        return Inertia::render('inventory/movements', [
            'movements' => $movements,
            'movementType' => $type,
        ]);
    }

    /**
     * Ensure the product belongs to the user's tenant
     */
    protected function authorizeTenant(Product $product): void
    {
        if ($product->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access.');
        }
    }
}
