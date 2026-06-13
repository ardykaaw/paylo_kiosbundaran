<?php

namespace App\Http\Controllers;

use App\Http\Requests\SupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class SupplierController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:suppliers.view', only: ['index', 'show']),
            new Middleware('permission:suppliers.create', only: ['create', 'store']),
            new Middleware('permission:suppliers.edit', only: ['edit', 'update']),
            new Middleware('permission:suppliers.delete', only: ['destroy']),
        ];
    }
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $perPage = $request->get('per_page', 10);

        $query = Supplier::where('tenant_id', auth()->user()->tenant_id)
            ->orderBy('name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $suppliers = $query->paginate($perPage);

        return Inertia::render('suppliers/index', [
            'suppliers' => $suppliers,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('suppliers/create');
    }

    public function store(SupplierRequest $request): RedirectResponse
    {
        Supplier::create([
            'tenant_id' => auth()->user()->tenant_id,
            ...$request->validated(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Supplier created successfully.']);

        return redirect()->route('suppliers.index');
    }

    public function edit(Supplier $supplier): Response
    {
        $this->authorizeTenant($supplier);

        return Inertia::render('suppliers/edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(SupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $this->authorizeTenant($supplier);

        $supplier->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Supplier updated successfully.']);

        return redirect()->route('suppliers.index');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $this->authorizeTenant($supplier);

        // Check if supplier has purchases
        if ($supplier->purchases()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot delete supplier with purchases.']);
            return back();
        }

        $supplier->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Supplier deleted successfully.']);

        return redirect()->route('suppliers.index');
    }

    protected function authorizeTenant(Supplier $supplier): void
    {
        if ($supplier->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access.');
        }
    }
}
