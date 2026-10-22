<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ $title ?? 'Sign in' }} · {{ config('app.name', 'ResponsivCode ERP') }}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        colors: {
                            brand: '#1e293b',
                        },
                        fontFamily: {
                            sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                        },
                        boxShadow: {
                            card: '0 10px 40px -12px rgb(15 23 42 / 0.18)',
                        },
                    },
                },
            }
        </script>
    </head>
    <body class="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased">
        <div class="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,41,59,0.08),_transparent_55%)]"></div>
        <div class="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
            {{ $slot }}
        </div>
    </body>
</html>
