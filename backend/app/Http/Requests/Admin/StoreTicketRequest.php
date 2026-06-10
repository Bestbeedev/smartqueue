<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id'      => ['required', 'integer', 'exists:services,id'],
            'priority'        => ['nullable', 'string', 'in:normal,high,vip,urgence'],
            'priority_reason' => ['nullable', 'string', 'max:100'],
            'customer_name'   => ['nullable', 'string', 'max:255'],
            'customer_phone'  => ['nullable', 'string', 'max:20'],
            'is_senior'       => ['nullable', 'boolean'],
            'is_handicap'     => ['nullable', 'boolean'],
            'is_pregnant'     => ['nullable', 'boolean'],
        ];
    }
}
