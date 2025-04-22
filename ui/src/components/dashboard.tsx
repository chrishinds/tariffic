'use client';
import "@/types";
import { useEffect, createContext, useState, Dispatch, SetStateAction } from 'react';


type DashboardContextType = {
    countryList?: CountryListType,
    companyStore?: CompanyStoreType,
    forecastData?: ForecastDataType,
    triggerRefresh?: () => void,
    yMin?: number,
    yMax?: number,
    isWorking?: boolean,
    pinned: PinManager,
    indexFetchError: Error | undefined,
};


export class PinManager {
    companies: Set<CompanyId>;
    setPinned: Dispatch<SetStateAction<Set<CompanyId>>>;

    constructor(companies: Set<CompanyId>, setPinned: Dispatch<SetStateAction<Set<CompanyId>>>) {
        this.companies = companies;
        this.setPinned = setPinned;
    }

    is() {
        return (companyId: CompanyId) => {
            return this.companies.has(companyId);
        };
    }

    not() {
        return (companyId: CompanyId) => {
            return !this.companies.has(companyId);
        };
    }

    remover(companiesToClear: Set<CompanyId>) {
        return () => {
            this.setPinned((pendingPins) => {
                return pendingPins.difference(companiesToClear);
            });
        };
    }

    adder(id: CompanyId) {
        return () => {
            this.setPinned((pendingPins) => {
                return new Set(pendingPins).add(id);
            });
        };
    }
}


export const DashboardContext = createContext<DashboardContextType>({});


export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [forecastUrl, setForecastUrl] = useState('http://localhost:8000');
    const [countryList, setCountryList]: [CountryListType | undefined, Dispatch<SetStateAction<CountryListType | undefined>>] = useState();
    const [companyStore, setCompanyStore]: [CompanyStoreType | undefined, Dispatch<SetStateAction<CompanyStoreType | undefined>>] = useState();
    const [forecastData, setForecastData]: [ForecastDataType | undefined, Dispatch<SetStateAction<ForecastDataType | undefined>>] = useState();
    const [refreshAt, setRefreshAt] = useState(new Date());
    const [isFetchingIndex, setIsFetchingIndex] = useState(true);
    const [pinnedCompanies, setPinnedCountries]: [Set<CompanyId>, Dispatch<SetStateAction<Set<CompanyId>>>] = useState(new Set<CompanyId>);
    const [indexFetchError, setIndexFetchError]: [Error | undefined, Dispatch<SetStateAction<Error | undefined>>] = useState();

    const undefinedDominantCompanyStoreMapReduce = (
        mathFun: (...values: Array<number>) => number | undefined,
        companyPropName: 'yMin' | 'yMax' | 'finishedPlotting',
        safeInitialValue: number
    ) => (
        Array.from(companyStore?.values() ?? []).map((company) => company[companyPropName]).reduce(
            (acc, next) => (next === undefined || acc === undefined ? undefined : mathFun(acc, next)),
            safeInitialValue)
    );
    const yMin: number | undefined = undefinedDominantCompanyStoreMapReduce(Math.min, 'yMin', Number.MAX_SAFE_INTEGER);
    const yMax: number | undefined = undefinedDominantCompanyStoreMapReduce(Math.max, 'yMax', Number.MIN_SAFE_INTEGER);
    // with chart animation off, we are busy until index and forecast fetches are complete
    const isWorking: boolean = isFetchingIndex && yMax !== undefined;

    const companyUpdater = (company: CompanyType) => {
        setCompanyStore((pendingCompanyStore) => {
            if (pendingCompanyStore?.has(company.id)) {
                return new Map(pendingCompanyStore).set(company.id, company);
            } else {
                return pendingCompanyStore;
            }
        });
    };

    const forecastUpdater = (updateData: Array<Array<[key: string, value: any]>>) => {
        setForecastData((pendingData) => {
            const data = pendingData ?? updateData.map(() => new Object());
            return data.map((row, index) => {
                const newRow: any = new Object(row);
                // this assumes that x: Date aligns perfectly by index on all forecasts
                updateData.at(index)!.forEach(([key, value]) => {
                    newRow[key] = value;
                });
                return newRow;
            });
        });
    };

    useEffect(() => {
        let cleanupCalled = false;

        const fetcher = (url: string, setter: any) => {
            (async () => {
                const [fetchedData, err] = await fetch(url).then(async (response) => {
                    if (response.ok) {
                        return [await response.json(), undefined];
                    } else {
                        return [undefined, new Error(`Failed to fetch ${url}, status: ${response.status}`)];
                    }
                }).catch((value) => {
                    if (value instanceof Error) {
                        return [undefined, new Error(`Error during ${url} fetch,`, { cause: value })];
                    } else {
                        try {
                            return [undefined, new Error(`Error during ${url} fetch, cause: ${JSON.stringify(value)}`)];
                        } catch {
                            return [undefined, new Error(`Error during ${url} fetch`)];
                        }
                    }
                });
                if (!cleanupCalled) {
                    setter(fetchedData, err);
                }
            })();
        };

        const wranglerForForecast = (company: CompanyType) => {
            return (forecastData: ApiRouteForecast | undefined, err: Error | undefined) => {
                if (forecastData !== undefined) {
                    const startMs: number = company.xMin.valueOf();
                    const intervalMs: number = (company.xMax.valueOf() - startMs) / forecastData.length;
                    forecastUpdater(forecastData.map((value, i) => (
                        [['x', new Date(startMs + i * intervalMs)], [company.id, value]]
                    )));
                    companyUpdater({
                        ...company,
                        yMin: Math.min(...forecastData),
                        yMax: Math.max(...forecastData),
                        err: err,
                    });
                } else if (err !== undefined) {
                    companyUpdater({
                        ...company,
                        err: err,
                    });
                }
            };
        };

        const wrangleIndex = (untypedIndexData: ApiRouteIndex | undefined, err: Error | undefined) => {
            if (untypedIndexData !== undefined) {
                const wrangledCountries: CountryListType = [];
                const companyPairs: [CompanyId, CompanyType][] = [];
                untypedIndexData.countries.forEach((country, i) => {
                    const wrangledCountry = { flag: country.flag, name: country.name, companies: new Array<CompanyId>() };
                    wrangledCountries.push(wrangledCountry);
                    country.companies.forEach((company, j) => {
                        const companyId = `${refreshAt.valueOf()}_${i}_${j}`;
                        wrangledCountry.companies.push(companyId);
                        companyPairs.push([companyId, {
                            name: company.name,
                            forecastUrl: company.forecast_url,
                            id: companyId,
                            colour: `hsl(${360 * j / country.companies.length}deg, 100%, 45%)`,
                            xMin: new Date(untypedIndexData.start_date),
                            xMax: new Date(untypedIndexData.end_date),
                            err: undefined,
                        }]);
                    });
                });
                setCompanyStore(new Map(companyPairs));
                setCountryList(wrangledCountries);
                setIsFetchingIndex(false);
                companyPairs.forEach(([_, company]) => {
                    try {
                        fetcher(forecastUrl + company.forecastUrl, wranglerForForecast(company));
                    } catch (e) {
                        // ensure that if we don't successfully fetch data, that we do nevertheless report bounds
                        companyUpdater({ ...company, yMin: Number.MAX_SAFE_INTEGER, yMax: Number.MIN_SAFE_INTEGER });
                        throw e;
                    }
                });
            }
            if (err !== undefined) {
                setIsFetchingIndex(false);
                setIndexFetchError(err);
            }
        };
        setIsFetchingIndex(true);
        fetcher(forecastUrl + '/forecast/', wrangleIndex);

        return () => {
            cleanupCalled = true;
        };
    }, [forecastUrl, refreshAt]);


    const triggerRefresh = () => {
        setIsFetchingIndex(true);
        setRefreshAt(new Date());
    };

    return (
        <DashboardContext.Provider value={{
            countryList: countryList,
            companyStore: companyStore,
            forecastData: forecastData,
            triggerRefresh: triggerRefresh,
            yMin: yMin,
            yMax: yMax,
            isWorking: isWorking,
            pinned: new PinManager(pinnedCompanies, setPinnedCountries),
            indexFetchError: indexFetchError,
        }}>
            {children}
        </DashboardContext.Provider>
    );
}