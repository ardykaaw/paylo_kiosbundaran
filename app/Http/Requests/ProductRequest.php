<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'category_id' => ['nullable', 'exists:categories,id'],
            'sku' => ['required', 'string', 'max:50', Rule::unique('products')->where('tenant_id', auth()->user()?->tenant_id)->ignore($productId)],
            'barcode' => ['nullable', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'unit' => ['required', 'string', 'max:20'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'wholesale_prices' => ['nullable', 'array'],
            'wholesale_prices.*.min_qty' => ['required_with:wholesale_prices', 'integer', 'min:2'],
            'wholesale_prices.*.price' => ['required_with:wholesale_prices', 'numeric', 'min:0'],
            'wholesale_prices.*.unit' => ['nullable', 'string', 'max:20'],
            'min_stock' => ['required', 'integer', 'min:0'],
            'max_stock' => ['required', 'integer', 'min:0'],
            'reorder_point' => ['required', 'integer', 'min:0'],
            'current_stock' => ['required', 'integer', 'min:0'],
            'image_file' => ['nullable', 'image', 'max:2048'],
            'is_active' => ['boolean'],
            'is_track_stock' => ['boolean'],
        ];
    }
}
