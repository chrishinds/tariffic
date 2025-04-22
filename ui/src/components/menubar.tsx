'use client';

import { useContext } from 'react';
import { DashboardContext } from '@/components/dashboard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


export function Menubar() {
    const { triggerRefresh, isWorking: isLoading } = useContext(DashboardContext);
    const pathname = usePathname();
    const groupLink = pathname === '/grouped' ? (<Link className="menu" href='/'>Ungroup&nbsp;Forecasts</Link>) : (<Link className="menu" href='/grouped'>Group&nbsp;Forecasts</Link>);
    return (
        <nav>
            <ul>
                <li><div className={isLoading ? "spinnerOn" : "spinner"}>🌍</div></li>
                <li><div className="menu" style={{ fontWeight: 'bold' }}>World&nbsp;Economy</div></li>
                <li><Link className="menu" href={pathname} onClick={triggerRefresh ? triggerRefresh! : () => { }}>Randomise&nbsp;Tariffs</Link></li>
                <li>{groupLink}</li>
                <li style={{ marginLeft: "auto" }}><Link className="menu" href="/logout">Logout</Link></li>
            </ul>
        </nav>
    );
}