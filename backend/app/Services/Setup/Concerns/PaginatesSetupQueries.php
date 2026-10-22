<?php

namespace App\Services\Setup\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait PaginatesSetupQueries
{
    protected function applySearch(Builder $query, ?string $search, array $columns): Builder
    {
        if (! $search) {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($search, $columns) {
            foreach ($columns as $column) {
                $builder->orWhere($column, 'like', '%'.$search.'%');
            }
        });
    }

    protected function applyStatusFilter(Builder $query, ?string $status): Builder
    {
        if (! $status) {
            return $query;
        }

        return $query->where('status', $status);
    }

    protected function paginateQuery(Builder $query, Request $request)
    {
        $perPage = min(max($request->integer('per_page', 15), 1), 100);

        return $query->paginate($perPage);
    }
}
