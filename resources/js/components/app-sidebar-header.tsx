import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePage } from '@inertiajs/react';
import { Calendar, Search } from 'lucide-react';
import * as React from 'react';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props as any;
    const getInitials = useInitials();
    const [currentDate, setCurrentDate] = React.useState('');

    React.useEffect(() => {
        const today = new Date();
        const options: Intl.DateTimeFormatOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        setCurrentDate(today.toLocaleDateString('id-ID', options));
    }, []);

    const pageTitle = breadcrumbs.length > 0 
        ? breadcrumbs[breadcrumbs.length - 1].title 
        : 'Dasbor';

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <div className="flex flex-col">
                    <h1 className="font-sans font-bold text-[15px] leading-[23px] text-[oklch(1_0_0)]">
                        {pageTitle}
                    </h1>
                    {breadcrumbs.length > 1 && (
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative hidden sm:flex items-center rounded-lg border border-sidebar-border/50 bg-sidebar-accent/30 px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cari..."
                        className="ml-2 bg-transparent text-sm outline-none placeholder:text-muted-foreground w-40"
                    />
                </div>

                {/* Date Info */}
                <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="font-sans text-[13px]">{currentDate}</span>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage
                            src={auth.user?.avatar}
                            alt={auth.user?.name}
                        />
                        <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                            {getInitials(auth.user?.name ?? '')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block">
                        <p className="font-sans font-bold text-[13px] text-foreground">
                            {auth.user?.name}
                        </p>
                        <p className="font-sans text-[11px] text-muted-foreground">
                            {auth.user?.email}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}
