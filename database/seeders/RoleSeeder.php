<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get or create default tenant
        $tenant = Tenant::firstOrCreate(
            ['subdomain' => 'default'],
            [
                'name' => 'Default Tenant',
                'status' => 'active',
                'max_users' => 100,
                'max_branches' => 50,
            ]
        );

        $roles = [
            [
                'name' => 'owner',
                'display_name' => 'Owner',
                'description' => 'Full access to all features',
                'is_default' => false,
                'permissions' => [
                    'dashboard.view',
                    'settings.view',
                    'settings.edit',
                    'users.view',
                    'users.create',
                    'users.edit',
                    'users.delete',
                    'roles.view',
                    'roles.create',
                    'roles.edit',
                    'roles.delete',
                    'branches.view',
                    'branches.create',
                    'branches.edit',
                    'branches.delete',
                    'products.view',
                    'products.create',
                    'products.edit',
                    'products.delete',
                    'categories.view',
                    'categories.create',
                    'categories.edit',
                    'categories.delete',
                    'suppliers.view',
                    'suppliers.create',
                    'suppliers.edit',
                    'suppliers.delete',
                    'customers.view',
                    'customers.create',
                    'customers.edit',
                    'customers.delete',
                    'purchases.view',
                    'purchases.create',
                    'purchases.edit',
                    'purchases.delete',
                    'sales.view',
                    'sales.create',
                    'sales.edit',
                    'sales.delete',
                    'stock.view',
                    'stock.adjust',
                    'reports.view',
                    'reports.export',
                    'attendances.view',
                    'attendances.edit',
                ],
            ],
            [
                'name' => 'manager',
                'display_name' => 'Manager',
                'description' => 'Mengelola operasional harian',
                'is_default' => true,
                'permissions' => [
                    'dashboard.view',
                    'users.view',
                    'users.create',
                    'users.edit',
                    'users.delete',
                    'branches.view',
                    'branches.create',
                    'branches.edit',
                    'products.view',
                    'products.create',
                    'products.edit',
                    'products.delete',
                    'categories.view',
                    'categories.create',
                    'categories.edit',
                    'categories.delete',
                    'suppliers.view',
                    'suppliers.create',
                    'suppliers.edit',
                    'suppliers.delete',
                    'customers.view',
                    'customers.create',
                    'customers.edit',
                    'customers.delete',
                    'purchases.view',
                    'purchases.create',
                    'purchases.edit',
                    'purchases.delete',
                    'sales.view',
                    'sales.create',
                    'sales.edit',
                    'sales.delete',
                    'stock.view',
                    'stock.adjust',
                    'reports.view',
                    'reports.export',
                    'attendances.view',
                    'attendances.edit',
                ],
            ],
            [
                'name' => 'kasir',
                'display_name' => 'Kasir',
                'description' => 'Cashier access for sales operations',
                'is_default' => false,
                'permissions' => [
                    'dashboard.view',
                    'customers.view',
                    'customers.create',
                    'customers.edit',
                    'sales.view',
                    'sales.create',
                    'sales.edit',
                    'attendances.view',
                    'attendances.edit',
                ],
            ],
            [
                'name' => 'gudang',
                'display_name' => 'Gudang',
                'description' => 'Warehouse access for inventory management',
                'is_default' => false,
                'permissions' => [
                    'dashboard.view',
                    'products.view',
                    'products.create',
                    'products.edit',
                    'products.delete',
                    'categories.view',
                    'categories.create',
                    'categories.edit',
                    'categories.delete',
                    'suppliers.view',
                    'suppliers.create',
                    'suppliers.edit',
                    'suppliers.delete',
                    'purchases.view',
                    'purchases.create',
                    'purchases.edit',
                    'purchases.delete',
                    'stock.view',
                    'stock.adjust',
                    'attendances.view',
                    'attendances.edit',
                ],
            ],
            [
                'name' => 'karyawan',
                'display_name' => 'Karyawan',
                'description' => 'Employee access for basic operations',
                'is_default' => false,
                'permissions' => [
                    'dashboard.view',
                    'attendances.view',
                    'attendances.edit',
                ],
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                [
                    'name' => $role['name'],
                    'tenant_id' => $tenant->id,
                ],
                [
                    'display_name' => $role['display_name'],
                    'description' => $role['description'],
                    'permissions' => $role['permissions'],
                    'is_default' => $role['is_default'],
                ]
            );
        }
    }
}
