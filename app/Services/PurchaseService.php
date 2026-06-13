<?php

namespace App\Services;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    /**
     * Create a new purchase with items
     */
    public function createPurchase(array $data): Purchase
    {
        return DB::transaction(function () use ($data) {
            $purchase = Purchase::create([
                'tenant_id' => auth()->user()->tenant_id,
                'branch_id' => $data['branch_id'],
                'supplier_id' => $data['supplier_id'],
                'number' => $data['number'],
                'date' => $data['date'],
                'due_date' => $data['due_date'] ?? null,
                'status' => $data['status'] ?? 'draft',
                'subtotal' => $data['subtotal'],
                'tax_amount' => $data['tax_amount'],
                'discount_amount' => $data['discount_amount'],
                'total_amount' => $data['total_amount'],
                'paid_amount' => $data['paid_amount'],
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            foreach ($data['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount_percent' => $item['discount_percent'] ?? 0,
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'tax_percent' => $item['tax_percent'] ?? 0,
                    'tax_amount' => $item['tax_amount'] ?? 0,
                    'subtotal' => $item['subtotal'],
                    'total' => $item['total'],
                    'received_quantity' => 0,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $purchase->load('items.product');
        });
    }

    /**
     * Update an existing purchase
     */
    public function updatePurchase(Purchase $purchase, array $data): Purchase
    {
        $this->authorizeTenant($purchase);

        return DB::transaction(function () use ($purchase, $data) {
            // Only allow updates if status is draft or pending
            if (!in_array($purchase->status, ['draft', 'pending'])) {
                throw new \Exception('Cannot update purchase with status: ' . $purchase->status);
            }

            $purchase->update([
                'branch_id' => $data['branch_id'],
                'supplier_id' => $data['supplier_id'],
                'number' => $data['number'],
                'date' => $data['date'],
                'due_date' => $data['due_date'] ?? null,
                'status' => $data['status'],
                'subtotal' => $data['subtotal'],
                'tax_amount' => $data['tax_amount'],
                'discount_amount' => $data['discount_amount'],
                'total_amount' => $data['total_amount'],
                'paid_amount' => $data['paid_amount'],
                'notes' => $data['notes'] ?? null,
            ]);

            // Delete existing items
            $purchase->items()->delete();

            // Create new items
            foreach ($data['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount_percent' => $item['discount_percent'] ?? 0,
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'tax_percent' => $item['tax_percent'] ?? 0,
                    'tax_amount' => $item['tax_amount'] ?? 0,
                    'subtotal' => $item['subtotal'],
                    'total' => $item['total'],
                    'received_quantity' => 0,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $purchase->load('items.product');
        });
    }

    /**
     * Receive purchase items and update stock
     */
    public function receivePurchase(Purchase $purchase, array $itemsReceived): Purchase
    {
        $this->authorizeTenant($purchase);

        return DB::transaction(function () use ($purchase, $itemsReceived) {
            if (!in_array($purchase->status, ['draft', 'pending'])) {
                throw new \Exception('Cannot receive purchase with status: ' . $purchase->status);
            }

            $allReceived = true;

            foreach ($itemsReceived as $itemData) {
                $purchaseItem = PurchaseItem::findOrFail($itemData['id']);

                if ($purchaseItem->purchase_id !== $purchase->id) {
                    throw new \Exception('Item does not belong to this purchase');
                }

                $quantityToReceive = $itemData['received_quantity'] - $purchaseItem->received_quantity;

                if ($quantityToReceive > 0) {
                    // Update product stock
                    $product = Product::findOrFail($purchaseItem->product_id);
                    $beforeQuantity = $product->current_stock;
                    $afterQuantity = $beforeQuantity + $quantityToReceive;

                    $product->update(['current_stock' => $afterQuantity]);

                    // Record stock movement
                    StockMovement::create([
                        'tenant_id' => auth()->user()->tenant_id,
                        'branch_id' => $purchase->branch_id,
                        'product_id' => $product->id,
                        'reference_type' => 'Purchase',
                        'reference_id' => $purchase->id,
                        'movement_type' => 'purchase',
                        'quantity' => $quantityToReceive,
                        'before_quantity' => $beforeQuantity,
                        'after_quantity' => $afterQuantity,
                        'unit_cost' => $purchaseItem->unit_price,
                        'notes' => "Purchase #{$purchase->number}",
                        'created_by' => auth()->id(),
                    ]);

                    // Update purchase item received quantity
                    $purchaseItem->update(['received_quantity' => $itemData['received_quantity']]);
                }

                // Check if all items are fully received
                if ($purchaseItem->received_quantity < $purchaseItem->quantity) {
                    $allReceived = false;
                }
            }

            // Update purchase status
            $purchase->update([
                'status' => $allReceived ? 'received' : 'pending',
                'received_at' => $allReceived ? now() : null,
            ]);

            return $purchase->load('items.product');
        });
    }

    /**
     * Delete a purchase
     */
    public function deletePurchase(Purchase $purchase): bool
    {
        $this->authorizeTenant($purchase);

        if (!in_array($purchase->status, ['draft', 'pending'])) {
            throw new \Exception('Cannot delete purchase with status: ' . $purchase->status);
        }

        return DB::transaction(function () use ($purchase) {
            $purchase->items()->delete();
            return $purchase->delete();
        });
    }

    /**
     * Generate purchase number
     */
    public function generatePurchaseNumber(): string
    {
        $tenantId = auth()->user()->tenant_id;
        $date = now()->format('Ymd');
        $lastPurchase = Purchase::where('tenant_id', $tenantId)
            ->where('number', 'like', "PO-{$date}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($lastPurchase) {
            $lastNumber = (int) substr($lastPurchase->number, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return "PO-{$date}-{$newNumber}";
    }

    /**
     * Ensure the purchase belongs to the user's tenant
     */
    protected function authorizeTenant(Purchase $purchase): void
    {
        if ($purchase->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access.');
        }
    }
}
