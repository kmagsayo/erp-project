<?php

namespace App\Services\Setup;

use App\Models\User;
use App\Services\Setup\Concerns\PaginatesSetupQueries;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UserService
{
    use PaginatesSetupQueries;

    public function getUsers(Request $request)
    {
        $query = User::query()
            ->with('position')
            ->orderBy('id');

        $this->applySearch($query, $request->query('search'), [
            'username',
            'name',
            'email',
        ]);
        $this->applyStatusFilter($query, $request->query('status'));

        return $this->paginateQuery($query, $request);
    }

    public function createUser(array $data): User
    {
        $payload = $this->preparePayload($data);

        return User::query()->create($payload)->load('position');
    }

    public function updateUser(User $user, array $data): User
    {
        $payload = $this->preparePayload($data, updating: true);

        $user->update($payload);

        return $user->fresh(['position']);
    }

    public function deleteUser(User $user): void
    {
        $user->tokens()->delete();
        $user->delete();
    }

    protected function preparePayload(array $data, bool $updating = false): array
    {
        $payload = [
            'username' => Str::lower(trim($data['username'])),
            'name' => trim($data['name']),
            'email' => isset($data['email']) && $data['email'] !== ''
                ? Str::lower(trim($data['email']))
                : Str::lower(trim($data['username'])).'@responsivcode.com',
            'position_id' => $data['position_id'] ?? null,
            'type' => $data['type'] ?? 'user',
            'status' => $data['status'] ?? 'active',
        ];

        if (! empty($data['password'])) {
            $payload['password'] = $data['password'];
        }

        return $payload;
    }
}
