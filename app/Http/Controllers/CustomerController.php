<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CustomerController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:customers.view', only: ['index', 'show']),
            new Middleware('permission:customers.create', only: ['create', 'store']),
            new Middleware('permission:customers.edit', only: ['edit', 'update']),
            new Middleware('permission:customers.delete', only: ['destroy']),
        ];
    }
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $perPage = $request->get('per_page', 10);

        $query = Customer::where('tenant_id', auth()->user()->tenant_id)
            ->orderBy('name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->paginate($perPage);

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('customers/create');
    }

    public function store(CustomerRequest $request): RedirectResponse
    {
        Customer::create([
            'tenant_id' => auth()->user()->tenant_id,
            ...$request->validated(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Customer created successfully.']);

        return redirect()->route('customers.index');
    }

    public function edit(Customer $customer): Response
    {
        $this->authorizeTenant($customer);

        return Inertia::render('customers/edit', [
            'customer' => $customer,
        ]);
    }

    public function update(CustomerRequest $request, Customer $customer): RedirectResponse
    {
        $this->authorizeTenant($customer);

        $customer->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Customer updated successfully.']);

        return redirect()->route('customers.index');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $this->authorizeTenant($customer);

        // Check if customer has sales
        if ($customer->sales()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot delete customer with sales.']);
            return back();
        }

        $customer->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Customer deleted successfully.']);

        return redirect()->route('customers.index');
    }

    protected function authorizeTenant(Customer $customer): void
    {
        if ($customer->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access.');
        }
    }
}
