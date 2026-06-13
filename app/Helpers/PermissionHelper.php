<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Auth;

class PermissionHelper
{
    /**
     * Check if current user has a specific role
     */
    public static function hasRole(string $role): bool
    {
        if (!Auth::check()) {
            return false;
        }

        return Auth::user()->hasRole($role);
    }

    /**
     * Check if current user has a specific permission
     */
    public static function hasPermission(string $permission): bool
    {
        if (!Auth::check()) {
            return false;
        }

        return Auth::user()->hasPermission($permission);
    }

    /**
     * Check if current user has any of the given permissions
     */
    public static function hasAnyPermission(array $permissions): bool
    {
        if (!Auth::check()) {
            return false;
        }

        return Auth::user()->hasAnyPermission($permissions);
    }

    /**
     * Check if current user has all of the given permissions
     */
    public static function hasAllPermissions(array $permissions): bool
    {
        if (!Auth::check()) {
            return false;
        }

        return Auth::user()->hasAllPermissions($permissions);
    }

    /**
     * Get all permissions for current user
     */
    public static function getPermissions(): array
    {
        if (!Auth::check()) {
            return [];
        }

        return Auth::user()->getPermissions();
    }

    /**
     * Get menu items based on user permissions
     */
    public static function getMenuItems(): array
    {
        if (!Auth::check()) {
            return [];
        }

        $permissions = self::getPermissions();

        $menuItems = [
            [
                'title' => 'Dasbor',
                'href' => route('dashboard'),
                'permission' => 'dashboard.view',
                'icon' => 'LayoutDashboard',
                'group' => 'Utama',
            ],
            [
                'title' => 'Produk',
                'href' => route('products.index'),
                'permission' => 'products.view',
                'icon' => 'Package',
                'group' => 'Master Data',
            ],
            [
                'title' => 'Kategori',
                'href' => route('categories.index'),
                'permission' => 'categories.view',
                'icon' => 'LayoutGrid',
                'group' => 'Master Data',
            ],
            [
                'title' => 'Pemasok',
                'href' => route('suppliers.index'),
                'permission' => 'suppliers.view',
                'icon' => 'Truck',
                'group' => 'Master Data',
            ],
            [
                'title' => 'Pelanggan',
                'href' => route('customers.index'),
                'permission' => 'customers.view',
                'icon' => 'Users',
                'group' => 'Master Data',
            ],
            [
                'title' => 'Pembelian',
                'href' => route('purchases.index'),
                'permission' => 'purchases.view',
                'icon' => 'ShoppingCart',
                'group' => 'Transaksi',
            ],
            [
                'title' => 'Kasir',
                'href' => route('pos.index'),
                'permission' => 'sales.create',
                'icon' => 'Calculator',
                'group' => 'Transaksi',
            ],
            [
                'title' => 'Riwayat Penjualan',
                'href' => route('sales.index'),
                'permission' => 'sales.view',
                'icon' => 'Receipt',
                'group' => 'Transaksi',
            ],
            [
                'title' => 'Stok',
                'href' => route('inventory.index'),
                'permission' => 'stock.view',
                'icon' => 'Warehouse',
                'group' => 'Transaksi',
            ],
            [
                'title' => 'Laporan',
                'href' => route('reports.index'),
                'permission' => 'reports.view',
                'icon' => 'BarChart3',
                'group' => 'Laporan',
            ],
            [
                'title' => 'Kehadiran',
                'href' => route('attendance.index'),
                'permission' => 'attendances.view',
                'icon' => 'Clock',
                'group' => 'Pengaturan',
            ],
            [
                'title' => 'Pengguna',
                'href' => route('users.index'),
                'permission' => 'users.view',
                'icon' => 'UserCog',
                'group' => 'Pengaturan',
            ],
            [
                'title' => 'Cabang',
                'href' => route('branches.index'),
                'permission' => 'branches.view',
                'icon' => 'Building2',
                'group' => 'Pengaturan',
            ],
            [
                'title' => 'Pengaturan',
                'href' => route('profile.edit'),
                'permission' => 'settings.view',
                'icon' => 'Settings',
                'group' => 'Pengaturan',
            ],
        ];

        return self::filterMenuByPermissions($menuItems, $permissions);
    }

    /**
     * Filter menu items based on permissions
     */
    private static function filterMenuByPermissions(array $items, array $permissions): array
    {
        $filtered = [];

        foreach ($items as $item) {
            if (in_array($item['permission'], $permissions)) {
                if (isset($item['children']) && is_array($item['children'])) {
                    $filteredChildren = self::filterMenuByPermissions($item['children'], $permissions);
                    if (!empty($filteredChildren)) {
                        $item['children'] = $filteredChildren;
                        $filtered[] = $item;
                    }
                } else {
                    $filtered[] = $item;
                }
            }
        }

        return $filtered;
    }
}
