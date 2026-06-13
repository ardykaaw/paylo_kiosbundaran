<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UserController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:users.view', only: ['index', 'show']),
            new Middleware('permission:users.create', only: ['create', 'store']),
            new Middleware('permission:users.edit', only: ['edit', 'update']),
            new Middleware('permission:users.delete', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $tenantId = auth()->user()->tenant_id;
        $search = $request->get('search');
        $roleFilter = $request->get('role');
        $statusFilter = $request->get('status');
        $perPage = $request->get('per_page', 10);

        $query = User::where('tenant_id', $tenantId)
            ->with(['roles', 'branch'])
            ->orderBy('name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($roleFilter) {
            $query->whereHas('roles', function ($q) use ($roleFilter) {
                $q->where('roles.id', $roleFilter);
            });
        }

        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }

        $users = $query->paginate($perPage);

        $roles = Role::where('tenant_id', $tenantId)->orderBy('display_name')->get();
        $branches = Branch::where('tenant_id', $tenantId)->where('is_active', true)->orderBy('name')->get();

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $roles,
            'branches' => $branches,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
                'status' => $statusFilter,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): Response
    {
        $tenantId = auth()->user()->tenant_id;

        $roles = Role::where('tenant_id', $tenantId)->orderBy('display_name')->get();
        $branches = Branch::where('tenant_id', $tenantId)->where('is_active', true)->orderBy('name')->get();

        return Inertia::render('users/create', [
            'roles' => $roles,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:20'],
            'status' => ['required', 'in:active,inactive'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $user = User::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'],
            'branch_id' => $validated['branch_id'] ?? null,
        ]);

        $user->roles()->attach($validated['role_id'], [
            'assigned_at' => now(),
            'assigned_by' => auth()->id(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User created successfully.']);

        return redirect()->route('users.index');
    }

    public function edit(User $user): Response
    {
        $this->authorizeTenant($user);

        $tenantId = auth()->user()->tenant_id;
        $user->load(['roles', 'branch']);

        $roles = Role::where('tenant_id', $tenantId)->orderBy('display_name')->get();
        $branches = Branch::where('tenant_id', $tenantId)->where('is_active', true)->orderBy('name')->get();

        return Inertia::render('users/edit', [
            'user' => $user,
            'roles' => $roles,
            'branches' => $branches,
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorizeTenant($user);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:20'],
            'status' => ['required', 'in:active,inactive'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'],
            'branch_id' => $validated['branch_id'] ?? null,
        ]);

        if (!empty($validated['password'])) {
            $user->update(['password' => Hash::make($validated['password'])]);
        }

        // Sync role
        $user->roles()->sync([$validated['role_id'] => [
            'assigned_at' => now(),
            'assigned_by' => auth()->id(),
        ]]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User updated successfully.']);

        return redirect()->route('users.index');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->authorizeTenant($user);

        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'You cannot delete your own account.']);
            return back();
        }

        $user->roles()->detach();
        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User deleted successfully.']);

        return redirect()->route('users.index');
    }

    protected function authorizeTenant(User $user): void
    {
        if ($user->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access.');
        }
    }
}
