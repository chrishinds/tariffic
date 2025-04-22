// ------ API Types ------

type ApiRouteIndex = {
    start_date: string,
    end_date: string,
    countries: Array<{
        flag: string,
        name: string,
        companies: Array<{ name: string, forecast_url: string }>,
    }>,
};

type ApiRouteForecast = Array<number>;

// ------ Page Types ------

type CompanyId = string;

type CountryListType = Array<{
    flag: string,
    name: string,
    companies: Array<CompanyId>,
}>;

type CompanyType = {
    name: string,
    forecastUrl: string,
    id: string,
    colour: string,
    xMin: Date,
    xMax: Date,
    yMin?: number,
    yMax?: number,
    finishedPlotting?: number,
    err: Error | undefined,
};

type CompanyStoreType = Map<CompanyId, CompanyType>;

type ForecastDataType = Array<Object>;
