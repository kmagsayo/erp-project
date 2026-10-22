<?php

namespace App\Services\Setup;

use App\Models\Customer;
use App\Models\Project;
use App\Services\Setup\Concerns\AllocatesSetupCodes;
use App\Services\Setup\Concerns\PaginatesSetupQueries;
use Illuminate\Http\Request;

class ProjectService
{
    use AllocatesSetupCodes;
    use PaginatesSetupQueries;

    public function getProjects(Request $request)
    {
        $query = Project::query()->with('customer')->orderBy('project_name');

        $this->applySearch($query, $request->query('search'), [
            'project_code',
            'project_name',
            'location',
            'remarks',
        ]);
        $this->applyStatusFilter($query, $request->query('status'));

        if ($customerId = $request->query('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        return $this->paginateQuery($query, $request);
    }

    public function getProjectById(int $id): Project
    {
        return Project::query()->with('customer')->findOrFail($id);
    }

    public function createProject(array $data): Project
    {
        Customer::query()->findOrFail($data['customer_id']);
        unset($data['project_code']);

        $project = Project::query()->create([
            ...$data,
            'project_code' => 'PRJ-TMP-'.uniqid(),
        ]);
        $project->update([
            'project_code' => $this->nextSequentialCode('projects', 'project_code', 'PRJ-', 3, $project->id),
        ]);

        return $project->load('customer');
    }

    public function updateProject(Project $project, array $data): Project
    {
        Customer::query()->findOrFail($data['customer_id']);
        unset($data['project_code']);

        $project->update($data);

        return $project->fresh(['customer']);
    }

    public function deleteProject(Project $project): void
    {
        $project->delete();
    }
}
