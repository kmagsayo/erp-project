<?php

namespace App\Services\Setup\Concerns;

use Illuminate\Support\Facades\DB;

trait AllocatesSetupCodes
{
    protected function nextSequentialCode(
        string $table,
        string $column,
        string $prefix,
        int $pad,
        ?int $ignoreId = null,
    ): string {
        $query = DB::table($table)->where($column, 'like', $prefix.'%');
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        $max = 0;
        foreach ($query->pluck($column) as $code) {
            $suffix = substr((string) $code, strlen($prefix));
            if (ctype_digit($suffix)) {
                $max = max($max, (int) $suffix);
            }
        }

        return $prefix.str_pad((string) ($max + 1), $pad, '0', STR_PAD_LEFT);
    }
}
