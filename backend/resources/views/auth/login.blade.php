<x-layouts.guest>
    <x-slot:title>Sign in</x-slot:title>

    <div class="w-full max-w-[420px]">
        <div class="mb-8 text-center">
            <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-card">
                <span class="text-lg font-semibold tracking-tight">RC</span>
            </div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Enterprise ERP</p>
            <h1 class="mt-2 text-2xl font-semibold tracking-tight text-brand">Welcome back</h1>
            <p class="mt-2 text-sm leading-6 text-slate-500">
                Sign in with your company credentials to access the platform.
            </p>
        </div>

        <div class="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-card">
            <form method="POST" action="{{ route('login') }}" class="space-y-5" novalidate>
                @csrf

                <div>
                    <label for="email" class="mb-1.5 block text-sm font-medium text-slate-700">
                        Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value="{{ old('email') }}"
                        required
                        autofocus
                        autocomplete="username"
                        placeholder="name@company.com"
                        class="block w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/15 @error('email') border-red-500 @else border-slate-300 @enderror"
                    >
                    @error('email')
                        <p class="mt-1.5 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <div>
                    <label for="password" class="mb-1.5 block text-sm font-medium text-slate-700">
                        Password
                    </label>
                    <div class="relative">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            autocomplete="current-password"
                            class="block w-full rounded-lg border px-3.5 py-2.5 pr-11 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/15 @error('password') border-red-500 @else border-slate-300 @enderror"
                        >
                        <button
                            type="button"
                            id="toggle-password"
                            class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-brand"
                            aria-label="Show password"
                            aria-pressed="false"
                        >
                            <svg id="icon-eye" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            <svg id="icon-eye-off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="hidden h-5 w-5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88M6.6 6.6C4.2 8.05 2.25 12 2.25 12s3.75 6.75 9.75 6.75c1.7 0 3.24-.4 4.55-1.05M17.4 17.4C19.8 15.95 21.75 12 21.75 12s-3.75-6.75-9.75-6.75c-.7 0-1.37.07-2 .2" />
                            </svg>
                        </button>
                    </div>
                    @error('password')
                        <p class="mt-1.5 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <div class="flex items-center justify-between">
                    <label class="inline-flex items-center gap-2 text-sm text-slate-600">
                        <input
                            id="remember"
                            name="remember"
                            type="checkbox"
                            value="1"
                            {{ old('remember') ? 'checked' : '' }}
                            class="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
                        >
                        Remember Me
                    </label>
                    @if (Route::has('password.request'))
                        <a href="{{ route('password.request') }}" class="text-sm font-medium text-brand hover:underline">
                            Forgot password?
                        </a>
                    @endif
                </div>

                <button
                    type="submit"
                    class="flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2"
                >
                    Sign in
                </button>
            </form>
        </div>

        <p class="mt-6 text-center text-xs text-slate-500">
            Protected session · {{ config('app.name', 'ResponsivCode ERP') }}
        </p>
    </div>

    <script>
        (function () {
            const input = document.getElementById('password');
            const toggle = document.getElementById('toggle-password');
            const eye = document.getElementById('icon-eye');
            const eyeOff = document.getElementById('icon-eye-off');
            if (!input || !toggle) return;

            toggle.addEventListener('click', function () {
                const hidden = input.type === 'password';
                input.type = hidden ? 'text' : 'password';
                toggle.setAttribute('aria-pressed', hidden ? 'true' : 'false');
                toggle.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
                eye.classList.toggle('hidden', hidden);
                eyeOff.classList.toggle('hidden', !hidden);
            });
        })();
    </script>
</x-layouts.guest>
