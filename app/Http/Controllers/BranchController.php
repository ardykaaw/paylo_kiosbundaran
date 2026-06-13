<?php

namespace App\Http\Controllers;

use App\Http\Requests\BranchRequest;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class BranchController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:branches.view', only: ['index', 'show']),
            new Middleware('permission:branches.create', only: ['create', 'store']),
            new Middleware('permission:branches.edit', only: ['edit', 'update']),
            new Middleware('permission:branches.delete', only: ['destroy']),
        ];
    }
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $perPage = $request->get('per_page', 10);

        $query = Branch::where('tenant_id', auth()->user()->tenant_id)
            ->with('manager')
            ->orderBy('name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $branches = $query->paginate($perPage);
        $managers = User::where('tenant_id', auth()->user()->tenant_id)
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('branches/index', [
            'branches' => $branches,
            'managers' => $managers,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): Response
    {
        $managers = User::where('tenant_id', auth()->user()->tenant_id)
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('branches/create', [
            'managers' => $managers,
        ]);
    }

    public function store(BranchRequest $request): RedirectResponse
    {
        Branch::create([
            'tenant_id' => auth()->user()->tenant_id,
            ...$request->validated(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Branch created successfully.']);

        return redirect()->route('branches.index');
    }

    public function edit(Branch $branch): Response
    {
        $this->authorizeTenant($branch);

        $managers = User::where('tenant_id', auth()->user()->tenant_id)
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('branches/edit', [
            'branch' => $branch,
            'managers' => $managers,
        ]);
    }

    public function update(BranchRequest $request, Branch $branch): RedirectResponse
    {
        $this->authorizeTenant($branch);

        $branch->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Branch updated successfully.']);

        return redirect()->route('branches.index');
    }

    public function destroy(Branch $branch): RedirectResponse
    {
        $this->authorizeTenant($branch);

        // Check if branch has users, purchases, sales, or stock movements
        if ($branch->users()->exists() || $branch->purchases()->exists() || $branch->sales()->exists() || $branch->stockMovements()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot delete branch with associated data.']);
            return back();
        }

        $branch->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Branch deleted successfully.']);

        return redirect()->route('branches.index');
    }

    protected function authorizeTenant(Branch $branch): void
    {
        if ($branch->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access.');
        }
    }
}
