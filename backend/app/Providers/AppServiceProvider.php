<?php

namespace App\Providers;

use App\Models\ProductModel;
use App\Models\UnitOfMeasure;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Route::bind('model', fn (string $value) => ProductModel::query()->findOrFail($value));
        Route::bind('unit', fn (string $value) => UnitOfMeasure::query()->findOrFail($value));
    }
}
