'use client';
import { useContext, useState, Dispatch, SetStateAction } from 'react';
import '@/types';
import Plotter from '@/components/plotter';

import { DashboardContext } from '@/components/dashboard';

export default function Home() {
  const { countryList, companyStore, pinned, indexFetchError } = useContext(DashboardContext);

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
          <section key={`${i} ${name}`}>
            <h1>{flag} {name}</h1>
            {(
              companies.filter(pinned.is()).length > 0) && (
                <Plotter key={name} isLarge={true} companies={companies.filter(pinned.is()).map((id) => companyStore.get(id)!)} onClose={pinned.remover(new Set(companies.filter(pinned.is())))} />
              )}
            {
              companies.filter(pinned.not()).map((id) => {
                return (
                  <Plotter key={id} companies={[companyStore.get(id)!]} title={companyStore.get(id)?.name} onPin={pinned.adder(id)} />
                );
              })
            }
          </section>
        ))}
      </main>
    )
  };
}
