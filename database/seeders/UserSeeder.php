<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
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

        // Get or create default branch
        $branch = Branch::firstOrCreate(
            [
                'tenant_id' => $tenant->id,
                'code' => 'MAIN',
            ],
            [
                'name' => 'Main Branch',
                'address' => 'Main Address',
                'phone' => '081234567890',
                'email' => 'main@default.com',
                'is_main' => true,
                'is_active' => true,
            ]
        );

        // Get roles
        $ownerRole = Role::where('name', 'owner')->where('tenant_id', $tenant->id)->first();
        $managerRole = Role::where('name', 'manager')->where('tenant_id', $tenant->id)->first();
        $kasirRole = Role::where('name', 'kasir')->where('tenant_id', $tenant->id)->first();
        $gudangRole = Role::where('name', 'gudang')->where('tenant_id', $tenant->id)->first();
        $karyawanRole = Role::where('name', 'karyawan')->where('tenant_id', $tenant->id)->first();

        // Create default users
        $users = [
            [
                'name' => 'Owner User',
                'email' => 'owner@paylo.com',
                'password' => 'password',
                'role' => $ownerRole,
                'branch' => $branch,
            ],
            [
                'name' => 'Manager User',
                'email' => 'manager@paylo.com',
                'password' => 'password',
                'role' => $managerRole,
                'branch' => $branch,
            ],
            [
                'name' => 'Kasir User',
                'email' => 'kasir@paylo.com',
                'password' => 'password',
                'role' => $kasirRole,
                'branch' => $branch,
            ],
            [
                'name' => 'Gudang User',
                'email' => 'gudang@paylo.com',
                'password' => 'password',
                'role' => $gudangRole,
                'branch' => $branch,
            ],
            [
                'name' => 'Karyawan User',
                'email' => 'karyawan@paylo.com',
                'password' => 'password',
                'role' => $karyawanRole,
                'branch' => $branch,
            ],
        ];

        foreach ($users as $userData) {
            if (!$userData['role']) {
                continue;
            }

            $user = User::firstOrCreate(
                [
                    'email' => $userData['email'],
                    'tenant_id' => $tenant->id,
                ],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'branch_id' => $userData['branch']->id,
                    'status' => 'active',
                ]
            );

            // Assign role
            $user->roles()->sync([$userData['role']->id]);
        }

        $this->command->info('Default users created successfully.');
        $this->command->info('Login credentials:');
        $this->command->info('================================');
        foreach ($users as $userData) {
            $this->command->info("Email: {$userData['email']}");
            $this->command->info("Password: {$userData['password']}");
            $this->command->info("Role: {$userData['role']->display_name}");
            $this->command->info('--------------------------------');
        }
    }
}
