<?php

namespace App\Http\Controllers\Api\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\UserRequest;
use App\Models\User;
use App\Services\Setup\UserService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use HandlesSetupActions;

    public function __construct(private readonly UserService $service) {}

    public function index(Request $request)
    {
        $users = $this->service->getUsers($request);

        return ApiResponse::paginated($users, 'users', 'Users retrieved successfully.');
    }

    public function store(UserRequest $request)
    {
        $user = $this->service->createUser($request->validated());

        return ApiResponse::success(['user' => $user], 'User created successfully.', 201);
    }

    public function show(User $user)
    {
        return ApiResponse::success(['user' => $user->load('position')], 'User retrieved successfully.');
    }

    public function update(UserRequest $request, User $user)
    {
        $user = $this->service->updateUser($user, $request->validated());

        return ApiResponse::success(['user' => $user], 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        return $this->runSetupAction(function () use ($user) {
            $this->service->deleteUser($user);

            return ApiResponse::success(null, 'User deleted successfully.');
        });
    }
}
