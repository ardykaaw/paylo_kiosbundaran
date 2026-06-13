import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Log in" />

            <PasskeyVerify />

            <div className="fixed inset-0 flex">
                {/* Left Side - Blue Section */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col items-center justify-center p-12 text-white overflow-auto">
                    <div className="max-w-md text-center">
                        <h1 className="text-4xl font-bold mb-6">Selamat Datang Kembali</h1>
                        <p className="text-blue-100 text-lg mb-8">
                            Kelola bisnis Anda secara efisien dengan platform komprehensif kami
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-blue-100">
                                Akses aman ke akun Anda dengan keamanan tingkat industri
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side - White Form Section */}
                <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 sm:p-12 overflow-auto">
                    <div className="w-full max-w-md">
                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Masuk</h2>
                            <p className="text-gray-600">Masukkan kredensial Anda untuk mengakses akun</p>
                        </div>

                        {status && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm font-medium text-green-800">{status}</p>
                            </div>
                        )}

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div>
                                        <Label htmlFor="email" className="text-gray-700 font-medium mb-2 block">
                                            Alamat Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder="email@contoh.com"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <Label htmlFor="password" className="text-gray-700 font-medium block">
                                                Kata Sandi
                                            </Label>
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                    tabIndex={5}
                                                >
                                                    Lupa?
                                                </TextLink>
                                            )}
                                        </div>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                            className="rounded border-gray-300"
                                        />
                                        <Label htmlFor="remember" className="text-gray-700 font-medium cursor-pointer">
                                            Ingat saya
                                        </Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && <Spinner />}
                                        {processing ? 'Sedang masuk...' : 'Masuk'}
                                    </Button>

                                    <div className="text-center text-sm text-gray-600 mt-6">
                                        Belum punya akun?{' '}
                                        <TextLink href={register()} tabIndex={5} className="text-blue-600 hover:text-blue-700 font-semibold">
                                            Buat satu
                                        </TextLink>
                                    </div>
                                </>
                            )}
                        </Form>

                        {/* Footer */}
                        <div className="mt-8 text-center text-xs text-gray-500">
                            <p>© 2026 Paylo Tenant. Semua hak dilindungi.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
