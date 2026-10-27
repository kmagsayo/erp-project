<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BillingScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'string', 'max:50'],
            'customer_name' => ['required', 'string', 'max:255'],
            'project_id' => ['required', 'string', 'max:50'],
            'project_name' => ['required', 'string', 'max:255'],
            'invoice_no' => ['nullable', 'string', 'max:50'],
            'transaction_date' => ['required', 'date'],
            'withholding_tax' => ['nullable', 'numeric', 'min:0'],
            'retention_amount' => ['nullable', 'numeric', 'min:0'],
            'recoupment_amount' => ['nullable', 'numeric', 'min:0'],
            'mobilization_amount' => ['nullable', 'numeric', 'min:0'],
            'contract_amount' => ['required', 'numeric', 'gt:0'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'run_day' => ['required', 'integer', 'between:1,31'],
            'remarks' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
            'items.*.id' => ['nullable', 'string', 'max:80'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['nullable', 'numeric'],
            'items.*.unit' => ['nullable', 'string'],
            'items.*.unitPrice' => ['nullable', 'numeric'],
            'items.*.amount' => ['nullable', 'numeric'],
            'items.*.accountNumber' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Select a client.',
            'customer_name.required' => 'Select a client.',
            'project_id.required' => 'Select a project.',
            'project_name.required' => 'Select a project.',
            'transaction_date.required' => 'Enter the transaction date.',
            'contract_amount.required' => 'Enter the contract amount.',
            'contract_amount.gt' => 'Enter the contract amount.',
            'start_date.required' => 'Enter the start date.',
            'end_date.required' => 'Enter the end date.',
            'end_date.after_or_equal' => 'End date cannot be before the start date.',
            'run_day.between' => 'Enter a run script day from 1 to 31.',
        ];
    }
}
