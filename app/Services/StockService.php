<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Record a stock movement
     */
    public function recordMovement(
        int $productId,
        string $movementType,
        float $quantity,
        float $unitCost = 0,
        ?int $branchId = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $notes = null,
        ?int $createdBy = null
    ): StockMovement {
        $product = Product::findOrFail($productId);
        $branchId = $branchId ?? auth()->user()?->branch_id;
        $createdBy = $createdBy ?? auth()->id();

        $beforeQuantity = $product->current_stock;
        $afterQuantity = $this->calculateAfterQuantity($movementType, $beforeQuantity, $quantity);

        return DB::transaction(function () use (
            $product,
            $movementType,
            $quantity,
            $unitCost,
            $branchId,
            $referenceType,
            $referenceId,
            $notes,
            $createdBy,
            $beforeQuantity,
            $afterQuantity
        ) {
            // Update product stock
            $product->update(['current_stock' => $afterQuantity]);

            // Record stock movement
            return StockMovement::create([
                'tenant_id' => auth()->user()->tenant_id,
                'branch_id' => $branchId,
                'product_id' => $product->id,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'movement_type' => $movementType,
                'quantity' => $quantity,
                'before_quantity' => $beforeQuantity,
                'after_quantity' => $afterQuantity,
                'unit_cost' => $unitCost,
                'notes' => $notes,
                'created_by' => $createdBy,
            ]);
        });
    }

    /**
     * Calculate after quantity based on movement type
     */
    protected function calculateAfterQuantity(string $movementType, float $beforeQuantity, float $quantity): float
    {
        return match ($movementType) {
            'in', 'purchase', 'return' => $beforeQuantity + $quantity,
            'out', 'sale', 'adjustment' => $beforeQuantity - $quantity,
            default => throw new \InvalidArgumentException("Invalid movement type: {$movementType}"),
        };
    }

    /**
     * Get stock history for a product
     */
    public function getProductHistory(int $productId, int $perPage = 20)
    {
        return StockMovement::where('product_id', $productId)
            ->where('tenant_id', auth()->user()->tenant_id)
            ->with(['branch', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get stock movements by type
     */
    public function getMovementsByType(string $movementType, int $perPage = 20)
    {
        return StockMovement::where('tenant_id', auth()->user()->tenant_id)
            ->where('movement_type', $movementType)
            ->with(['product', 'branch', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get low stock products
     */
    public function getLowStockProducts()
    {
        return Product::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->where('is_track_stock', true)
            ->whereColumn('current_stock', '<=', 'min_stock')
            ->where('min_stock', '>', 0)
            ->with('category')
            ->orderBy('current_stock')
            ->get();
    }

    /**
     * Get out of stock products
     */
    public function getOutOfStockProducts()
    {
        return Product::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->where('is_track_stock', true)
            ->where('current_stock', '<=', 0)
            ->with('category')
            ->orderBy('name')
            ->get();
    }

    /**
     * Manual stock adjustment
     */
    public function adjustStock(
        int $productId,
        float $newQuantity,
        ?string $notes = null,
        ?int $branchId = null
    ): StockMovement {
        $product = Product::findOrFail($productId);
        $branchId = $branchId ?? auth()->user()?->branch_id;

        $beforeQuantity = $product->current_stock;
        $difference = $newQuantity - $beforeQuantity;

        if ($difference === 0) {
            throw new \InvalidArgumentException('No adjustment needed. Quantity is the same.');
        }

        $movementType = $difference > 0 ? 'in' : 'out';
        $quantity = abs($difference);

        return $this->recordMovement(
            $productId,
            'adjustment',
            $quantity,
            $product->cost_price,
            $branchId,
            null,
            null,
            $notes ?? "Manual adjustment from {$beforeQuantity} to {$newQuantity}"
        );
    }
}
