<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Tenant;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Customer;

class DummyDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenant = Tenant::first();

        if (!$tenant) {
            $this->command->error('No tenant found. Please run the base seeders first.');
            return;
        }

        $faker = \Faker\Factory::create('id_ID');

        // Create 5 Categories
        $categories = [];
        $categoryNames = ['Sembako', 'Minuman', 'Makanan Ringan', 'Kebutuhan Mandi', 'Lain-lain'];
        foreach ($categoryNames as $name) {
            $categories[] = Category::create([
                'tenant_id' => $tenant->id,
                'code' => strtoupper(Str::random(5)),
                'name' => $name,
                'description' => $faker->sentence,
                'is_active' => true,
            ]);
        }

        // Create 3 Suppliers
        $suppliers = [];
        for ($i = 0; $i < 3; $i++) {
            $suppliers[] = Supplier::create([
                'tenant_id' => $tenant->id,
                'code' => strtoupper(Str::random(5)),
                'name' => $faker->company,
                'email' => $faker->unique()->safeEmail,
                'phone' => $faker->phoneNumber,
                'address' => $faker->address,
                'is_active' => true,
            ]);
        }

        // Create 20 Products
        $productNames = [
            'Beras Maknyus 5Kg', 'Minyak Goreng Bimoli 2L', 'Gula Pasir Gulaku 1Kg', 'Telur Ayam 1Kg',
            'Indomie Goreng', 'Kopi Kapal Api 165gr', 'Teh Pucuk Harum 350ml', 'Aqua Botol 600ml',
            'Susu Kental Manis Frisian Flag', 'Tepung Terigu Segitiga Biru 1Kg', 'Sabun Lifebuoy Total 10',
            'Pepsodent Pencegah Gigi Berlubang', 'Shampoo Clear Men', 'Deterjen Rinso Anti Noda',
            'Pewangi Pakaian Molto', 'Pampers Sweety Size M', 'Tissue Paseo 250s', 'Kecap Bango 520ml',
            'Saus Sambal ABC 340ml', 'Garam Dapur Kapal'
        ];

        foreach ($productNames as $name) {
            $cost = $faker->numberBetween(20, 100) * 100;
            $price = $cost + ($faker->numberBetween(10, 50) * 100);
            
            Product::create([
                'tenant_id' => $tenant->id,
                'category_id' => $faker->randomElement($categories)->id,
                'name' => $name,
                'sku' => strtoupper(Str::random(8)),
                'barcode' => $faker->ean13(),
                'description' => $faker->sentence,
                'cost_price' => $cost,
                'selling_price' => $price,
                'current_stock' => $faker->numberBetween(10, 100),
                'min_stock' => $faker->numberBetween(5, 10),
                'unit' => $faker->randomElement(['Pcs', 'Kg', 'Liter', 'Dus', 'Pack']),
                'is_active' => true,
            ]);
        }

        // Create 10 Customers
        for ($i = 0; $i < 10; $i++) {
            Customer::create([
                'tenant_id' => $tenant->id,
                'code' => strtoupper(Str::random(5)),
                'name' => $faker->name,
                'email' => $faker->unique()->safeEmail,
                'phone' => $faker->phoneNumber,
                'address' => $faker->address,
                'is_active' => true,
            ]);
        }

        $this->command->info('Successfully seeded 20 dummy products, categories, suppliers, and customers!');
    }
}
