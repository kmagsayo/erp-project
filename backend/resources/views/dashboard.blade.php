<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Dashboard · {{ config('app.name', 'ResponsivCode ERP') }}</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-100 font-sans text-slate-800">
        <div class="mx-auto max-w-3xl px-6 py-16">
            <h1 class="text-2xl font-semibold text-slate-900">Signed in</h1>
            <p class="mt-2 text-sm text-slate-600">
                {{ auth()->user()->name }} · {{ auth()->user()->email }}
            </p>
            <form method="POST" action="{{ route('logout') }}" class="mt-6">
                @csrf
                <button type="submit" class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
                    Sign out
                </button>
            </form>
        </div>
    </body>
</html>
