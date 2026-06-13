<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class SaleService
{
    /**
     * Create a new sale with items and update stock
     */
    public function createSale(array $data): Sale
    {
        return DB::transaction(function () use ($data) {
            $sale = Sale::create([
                'tenant_id' => auth()->user()->tenant_id,
                'branch_id' => $data['branch_id'],
                'customer_id' => $data['customer_id'] ?? null,
                'number' => $data['number'],
                'date' => $data['date'],
                'status' => $data['status'],
                'subtotal' => $data['subtotal'],
                'tax_amount' => $data['tax_amount'],
                'discount_amount' => $data['discount_amount'],
                'extra_charge_amount' => $data['extra_charge_amount'] ?? 0,
                'total_amount' => $data['total_amount'],
                'paid_amount' => $data['paid_amount'],
                'cash_amount' => $data['cash_amount'] ?? 0,
                'transfer_amount' => $data['transfer_amount'] ?? 0,
                'change_amount' => $data['change_amount'],
                'payment_method' => $data['payment_method'],
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            foreach ($data['items'] as $item) {
                // Create sale item
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount_percent' => $item['discount_percent'] ?? 0,
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'tax_percent' => $item['tax_percent'] ?? 0,
                    'tax_amount' => $item['tax_amount'] ?? 0,
                    'subtotal' => $item['subtotal'],
                    'total' => $item['total'],
                    'notes' => $item['notes'] ?? null,
                ]);

                // Update product stock
                $product = Product::findOrFail($item['product_id']);
                $beforeQuantity = $product->current_stock;
                $afterQuantity = $beforeQuantity - $item['quantity'];

                if ($afterQuantity < 0) {
                    throw new \Exception("Insufficient stock for product: {$product->name}");
                }

                $product->update(['current_stock' => $afterQuantity]);

                // Record stock movement
                StockMovement::create([
                    'tenant_id' => auth()->user()->tenant_id,
                    'branch_id' => $data['branch_id'],
                    'product_id' => $product->id,
                    'reference_type' => 'Sale',
                    'reference_id' => $sale->id,
                    'movement_type' => 'out',
                    'quantity' => $item['quantity'],
                    'before_quantity' => $beforeQuantity,
                    'after_quantity' => $afterQuantity,
                    'unit_cost' => $item['unit_price'],
                    'notes' => "Sale #{$sale->number}",
                    'created_by' => auth()->id(),
                ]);
            }

            return $sale->load('items.product');
        });
    }

    /**
     * Generate sale number
     */
    public function generateSaleNumber(): string
    {
        $tenantId = auth()->user()->tenant_id;
        $date = now()->format('Ymd');
        $lastSale = Sale::where('tenant_id', $tenantId)
            ->where('number', 'like', "SALE-{$date}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($lastSale) {
            $lastNumber = (int) substr($lastSale->number, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return "SALE-{$date}-{$newNumber}";
    }

    /**
     * Get products for POS with stock check
     */
    public function getPosProducts(?string $search = null, ?int $categoryId = null)
    {
        $query = Product::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->where('is_track_stock', true)
            ->where('current_stock', '>', 0)
            ->with(['category', 'prices'])
            ->orderBy('name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        return $query->get();
    }

    /**
     * Get sale receipt data
     */
    public function getReceiptData(Sale $sale): array
    {
        $sale->load(['items.product', 'customer', 'branch', 'createdBy']);

        return [
            'sale' => $sale,
            'tenant' => $sale->tenant,
        ];
    }
}
