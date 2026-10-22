<?php

namespace App\Http\Controllers\Api\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\ProjectRequest;
use App\Models\Project;
use App\Services\Setup\ProjectService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    use HandlesSetupActions;

    public function __construct(private readonly ProjectService $service) {}

    public function index(Request $request)
    {
        $projects = $this->service->getProjects($request);

        return ApiResponse::paginated($projects, 'projects', 'Projects retrieved successfully.');
    }

    public function store(ProjectRequest $request)
    {
        $project = $this->service->createProject($request->validated());

        return ApiResponse::success(['project' => $project], 'Project created successfully.', 201);
    }

    public function show(Project $project)
    {
        $project = $this->service->getProjectById($project->id);

        return ApiResponse::success(['project' => $project], 'Project retrieved successfully.');
    }

    public function update(ProjectRequest $request, Project $project)
    {
        $project = $this->service->updateProject($project, $request->validated());

        return ApiResponse::success(['project' => $project], 'Project updated successfully.');
    }

    public function destroy(Project $project)
    {
        return $this->runSetupAction(function () use ($project) {
            $this->service->deleteProject($project);

            return ApiResponse::success(null, 'Project deleted successfully.');
        });
    }
}
