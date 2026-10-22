<?php

namespace App\Http\Requests\Setup;

use Illuminate\Validation\Rule;

class ProjectRequest extends SetupFormRequest
{
    public function rules(): array
    {
        $projectId = $this->route('project');

        return [
            'project_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('projects', 'project_code')->ignore($projectId),
            ],
            'project_name' => ['required', 'string', 'max:255'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'location' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => $this->statusRule(),
            'remarks' => ['nullable', 'string'],
        ];
    }
}
