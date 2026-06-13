<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaleRequest;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class SaleController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:sales.view', only: ['index', 'show']),
            new Middleware('permission:sales.create', only: ['pos', 'store', 'receipt', 'create']),
            new Middleware('permission:sales.edit', only: ['edit', 'update']),
            new Middleware('permission:sales.delete', only: ['destroy']),
        ];
    }
    protected SaleService $saleService;

    public function __construct(SaleService $saleService)
    {
        $this->saleService = $saleService;
    }

    /**
     * Display sales history
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $status = $request->get('status');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $query = Sale::where('tenant_id', auth()->user()->tenant_id)
            ->with(['items.product', 'customer', 'branch', 'createdBy'])
            ->orderBy('created_at', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        $sales = $query->paginate(20);

        return Inertia::render('sales/index', [
            'sales' => $sales,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Display sale details
     */
    public function show(Sale $sale): Response
    {
        $this->authorizeTenant($sale);

        $sale->load(['items.product', 'customer', 'branch', 'createdBy']);

        return Inertia::render('sales/show', [
            'sale' => $sale,
        ]);
    }

    /**
     * Display POS interface
     */
    public function pos(Request $request): Response
    {
        $search = $request->get('search');
        $categoryId = $request->get('category');

        $products = $this->saleService->getPosProducts($search, $categoryId);
        $categories = Category::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
        $customers = Customer::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
        $branch = Branch::where('tenant_id', auth()->user()->tenant_id)
            ->where('id', auth()->user()->branch_id)
            ->first();

        return Inertia::render('pos/index', [
            'products' => $products,
            'categories' => $categories,
            'customers' => $customers,
            'branch' => $branch,
            'saleNumber' => $this->saleService->generateSaleNumber(),
            'filters' => [
                'search' => $search,
                'category' => $categoryId,
            ],
        ]);
    }

    /**
     * Process sale transaction
     */
    public function store(SaleRequest $request): \Illuminate\Http\JsonResponse
    {
        try {
            $sale = $this->saleService->createSale($request->validated());

            return response()->json([
                'success' => true,
                'sale' => $sale,
                'message' => 'Sale completed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get sale receipt
     */
    public function receipt(Sale $sale): Response
    {
        $this->authorizeTenant($sale);

        $receiptData = $this->saleService->getReceiptData($sale);

        return Inertia::render('pos/receipt', [
            'receipt' => $receiptData,
        ]);
    }

    /**
     * Ensure the sale belongs to the user's tenant
     */
    protected function authorizeTenant(Sale $sale): void
    {
        if ($sale->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access.');
        }
    }
}
