<?php

namespace App\Http\Controllers\Api\Setup;

use App\Support\ApiResponse;
use RuntimeException;

trait HandlesSetupActions
{
    protected function runSetupAction(callable $callback)
    {
        try {
            return $callback();
        } catch (RuntimeException $exception) {
            return ApiResponse::error($exception->getMessage(), null, 422);
        }
    }
}
