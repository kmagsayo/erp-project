<?php

use Illuminate\Support\Facades\Route;

Route::fallback(function () {
    $index = public_path('ui/index.html');

    if (! is_file($index)) {
        return response(
            "The local interface has not been built yet.\nRun start-local.bat in the project folder.\n",
            503,
            ['Content-Type' => 'text/plain; charset=UTF-8'],
        );
    }

    return response()->file($index);
});
