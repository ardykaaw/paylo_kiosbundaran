<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $customerId = $this->route('customer')?->id;

        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('customers')->where('tenant_id', auth()->user()?->tenant_id)->ignore($customerId)],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'credit_limit' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'is_walk_in' => ['boolean'],
            'is_special_wholesale' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
