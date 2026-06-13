<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseRequest;
use App\Models\Branch;
use App\Models\Purchase;
use App\Models\Product;
use App\Models\Supplier;
use App\Services\PurchaseService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PurchaseController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:purchases.view', only: ['index', 'show']),
            new Middleware('permission:purchases.create', only: ['create', 'store']),
            new Middleware('permission:purchases.edit', only: ['edit', 'update', 'receive', 'processReceive']),
            new Middleware('permission:purchases.delete', only: ['destroy']),
        ];
    }
    protected PurchaseService $purchaseService;

    public function __construct(PurchaseService $purchaseService)
    {
        $this->purchaseService = $purchaseService;
    }

    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $status = $request->get('status');
        $supplier = $request->get('supplier');
        $perPage = $request->get('per_page', 10);

        $query = Purchase::where('tenant_id', auth()->user()->tenant_id)
            ->with(['supplier', 'branch', 'items.product'])
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($search) {
            $query->where('number', 'like', "%{$search}%");
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($supplier) {
            $query->where('supplier_id', $supplier);
        }

        $purchases = $query->paginate($perPage);
        $suppliers = Supplier::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('purchases/index', [
            'purchases' => $purchases,
            'suppliers' => $suppliers,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'supplier' => $supplier,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): Response
    {
        $branches = Branch::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $suppliers = Supplier::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $products = Product::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('purchases/create', [
            'branches' => $branches,
            'suppliers' => $suppliers,
            'products' => $products,
            'purchaseNumber' => $this->purchaseService->generatePurchaseNumber(),
        ]);
    }

    public function store(PurchaseRequest $request): \Illuminate\Http\RedirectResponse
    {
        $purchase = $this->purchaseService->createPurchase($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Purchase created successfully.']);

        return redirect()->route('purchases.index');
    }

    public function show(Purchase $purchase): Response
    {
        $this->authorizeTenant($purchase);

        $purchase->load(['supplier', 'branch', 'items.product', 'createdBy']);

        return Inertia::render('purchases/show', [
            'purchase' => $purchase,
        ]);
    }

    public function edit(Purchase $purchase): Response
    {
        $this->authorizeTenant($purchase);

        if (!in_array($purchase->status, ['draft', 'pending'])) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot edit purchase with status: ' . $purchase->status]);
            return redirect()->route('purchases.index');
        }

        $branches = Branch::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $suppliers = Supplier::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $products = Product::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $purchase->load('items.product');

        return Inertia::render('purchases/edit', [
            'purchase' => $purchase,
            'branches' => $branches,
            'suppliers' => $suppliers,
            'products' => $products,
        ]);
    }

    public function update(PurchaseRequest $request, Purchase $purchase): \Illuminate\Http\RedirectResponse
    {
        $this->purchaseService->updatePurchase($purchase, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Purchase updated successfully.']);

        return redirect()->route('purchases.index');
    }

    public function destroy(Purchase $purchase): \Illuminate\Http\RedirectResponse
    {
        $this->purchaseService->deletePurchase($purchase);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Purchase deleted successfully.']);

        return redirect()->route('purchases.index');
    }

    public function receive(Purchase $purchase): Response
    {
        $this->authorizeTenant($purchase);

        if (!in_array($purchase->status, ['draft', 'pending'])) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot receive purchase with status: ' . $purchase->status]);
            return redirect()->route('purchases.show', $purchase);
        }

        $purchase->load(['items.product', 'supplier', 'branch']);

        return Inertia::render('purchases/receive', [
            'purchase' => $purchase,
        ]);
    }

    public function processReceive(Request $request, Purchase $purchase): \Illuminate\Http\RedirectResponse
    {
        $this->authorizeTenant($purchase);

        $itemsReceived = $request->input('items', []);

        $this->purchaseService->receivePurchase($purchase, $itemsReceived);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Purchase received successfully. Stock updated.']);

        return redirect()->route('purchases.show', $purchase);
    }

    protected function authorizeTenant(Purchase $purchase): void
    {
        if ($purchase->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access.');
        }
    }
}
