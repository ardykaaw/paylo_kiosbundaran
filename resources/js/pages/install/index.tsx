import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, CheckCircle2, ArrowRight } from 'lucide-react';

export default function InstallApp() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Cek apakah aplikasi sudah diinstal
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
            setIsInstalled(true);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            // Mencegah Chrome untuk langsung menampilkan prompt bawaan
            e.preventDefault();
            // Simpan event agar bisa dipanggil nanti
            setDeferredPrompt(e);
            // Update UI untuk memunculkan tombol instalasi
            setIsInstallable(true);
            setIsInstalled(false);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        
        // Munculkan prompt instalasi bawaan browser
        deferredPrompt.prompt();
        
        // Tunggu respon pengguna (apakah menekan "Install" atau "Cancel")
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
        
        // Prompt hanya bisa digunakan sekali, kosongkan kembali
        setDeferredPrompt(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
            <Head title="Install Paylo App" />
            
            <div className="absolute top-4 left-4">
                <Link href="/">
                    <Button variant="ghost" className="gap-2">
                        <ArrowRight className="h-4 w-4 rotate-180" /> Kembali
                    </Button>
                </Link>
            </div>

            <Card className="w-full max-w-md border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
                <CardHeader className="text-center pt-8 pb-4">
                    <div className="mx-auto w-24 h-24 mb-4 rounded-3xl overflow-hidden shadow-lg border border-border/50 ring-4 ring-primary/10">
                        <img src="/icons/pwa-192x192.png" alt="Paylo Logo" className="w-full h-full object-cover" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight text-primary">Paylo</CardTitle>
                    <CardDescription className="text-base mt-2">Aplikasi Kasir Modern & Cepat</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-6">
                    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-sm text-center">Mengapa Install Paylo?</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                <span>Akses secepat kilat langsung dari Home Screen</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                <span>Tampilan penuh (Fullscreen) tanpa gangguan address bar</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                <span>Dukungan memuat aplikasi saat Offline (tanpa internet)</span>
                            </li>
                        </ul>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 px-6 pb-8 pt-2">
                    {isInstalled ? (
                        <div className="w-full text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                            <p className="font-bold">Aplikasi Telah Diinstal!</p>
                            <p className="text-xs mt-1">Silakan buka Paylo dari Home Screen atau Menu Aplikasi perangkat Anda.</p>
                        </div>
                    ) : isInstallable ? (
                        <Button onClick={handleInstallClick} className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 rounded-xl">
                            <Download className="mr-2 h-5 w-5" />
                            Install Aplikasi Paylo
                        </Button>
                    ) : (
                        <div className="w-full text-center space-y-2">
                            <Button disabled className="w-full h-12 text-base font-bold rounded-xl opacity-50">
                                <Download className="mr-2 h-5 w-5" />
                                Install Aplikasi Paylo
                            </Button>
                            <p className="text-[11px] text-muted-foreground">
                                Browser/perangkat Anda tidak mendukung instalasi otomatis, atau aplikasi sudah terinstal. Coba gunakan Google Chrome atau Safari dan cek opsi "Add to Home Screen" di menu browser.
                            </p>
                        </div>
                    )}
                </CardFooter>
            </Card>
            
            <div className="mt-8 text-center text-xs text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Paylo Point of Sale.</p>
            </div>
        </div>
    );
}
