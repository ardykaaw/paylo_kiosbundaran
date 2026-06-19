<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ProductController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:products.view', only: ['index', 'show']),
            new Middleware('permission:products.create', only: ['create', 'store']),
            new Middleware('permission:products.edit', only: ['edit', 'update']),
            new Middleware('permission:products.delete', only: ['destroy']),
        ];
    }
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $category = $request->get('category');
        $perPage = $request->get('per_page', 10);

        $query = Product::where('tenant_id', auth()->user()->tenant_id)
            ->with('category')
            ->orderBy('name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($category) {
            $query->where('category_id', $category);
        }

        $products = $query->paginate($perPage);
        $categories = \App\Models\Category::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'category' => $category,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): Response
    {
        $categories = \App\Models\Category::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('products/create', [
            'categories' => $categories,
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        
        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/products'), $filename);
            $validated['image_path'] = '/uploads/products/' . $filename;
        }
        unset($validated['image_file']);

        Product::create([
            'tenant_id' => auth()->user()->tenant_id,
            ...$validated,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product created successfully.']);

        return redirect()->route('products.index');
    }

    public function edit(Product $product): Response
    {
        $this->authorizeTenant($product);

        $categories = \App\Models\Category::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('products/edit', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $this->authorizeTenant($product);

        $validated = $request->validated();

        if ($request->hasFile('image_file')) {
            if ($product->image_path && file_exists(public_path($product->image_path))) {
                unlink(public_path($product->image_path));
            }
            $file = $request->file('image_file');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/products'), $filename);
            $validated['image_path'] = '/uploads/products/' . $filename;
        }
        unset($validated['image_file']);

        $product->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product updated successfully.']);

        return redirect()->route('products.index');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorizeTenant($product);

        // Check if product has sales or purchases
        if ($product->saleItems()->exists() || $product->purchaseItems()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot delete product with transactions.']);
            return back();
        }

        $product->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product deleted successfully.']);

        return redirect()->route('products.index');
    }

    protected function authorizeTenant(Product $product): void
    {
        if ($product->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access.');
        }
    }
}
