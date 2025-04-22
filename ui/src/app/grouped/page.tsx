'use client';
import { useContext } from 'react';
import '@/types';
import Plotter from '@/components/plotter';

import { DashboardContext } from '@/components/dashboard';

export default function Grouped() {
    const { countryList, companyStore, indexFetchError } = useContext(DashboardContext);
    if (indexFetchError !== undefined) {
        console.log(indexFetchError);
        return (
            <main>
                <article className='heroic error'>Error fetching index page</article>
            </main>
        )
    } else if (countryList === undefined || companyStore === undefined) {
        return (
            <main>
                <article className='heroic loading'></article>
            </main>
        )
    } else {
        return (
            <main>
                {countryList.map(({ flag, name, companies }, i: number) => (
                    <section key={`grouped ${i} ${name}`}>
                        <h1>{flag} {name}</h1>
                        <Plotter key={`grouped ${name}`} isLarge={true} companies={companies.map((id) => companyStore.get(id)!)} />
                    </section>
                ))}
            </main>
        )
    };
}
