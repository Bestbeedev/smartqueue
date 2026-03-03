<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OnboardingRegisterEstablishmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'admin_name' => ['required','string','max:120'],
            'admin_email' => ['required','email','max:190','unique:users,email'],
            'admin_password' => ['required','string','min:8'],
            'admin_phone' => ['nullable','string','max:32','unique:users,phone'],

            'establishment_name' => ['required','string','max:160'],
            'establishment_address' => ['nullable','string'],
            'establishment_lat' => ['nullable','numeric','between:-90,90'],
            'establishment_lng' => ['nullable','numeric','between:-180,180'],
            'establishment_open_at' => ['nullable'],
            'establishment_close_at' => ['nullable'],
        ];
    }
}
