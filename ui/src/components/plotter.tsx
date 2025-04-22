import '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardContext } from '@/components/dashboard';
import { useContext } from 'react';


export default function Plotter({ companies, title, onPin, onClose, isLarge = false }:
    { companies: Array<CompanyType>, title?: string, onPin?: () => void, onClose?: () => void, isLarge?: boolean }
) {
    const { forecastData, yMin, yMax } = useContext(DashboardContext);
    const [firstCompany, ..._] = companies;
    const dateFormatter = (d: Date) => {
        return d.toLocaleDateString();
    };
    const datetimeFormatter = (d: Date) => {
        return d.toLocaleString();
    }
    const priceFormatter = (n: number) => {
        return `$${n.toFixed(2)}`;
    };
    // VerticalCoordinatesGenerator type not exported from recharts
    // This seemingly simple requirement is surprisingly involved
    const temporalGridGen = (basis: 'year' | 'month') => {
        return ({ xAxis, width, height, offset }) => {
            const [start, end]: [number, number] = xAxis.domain;
            const epochGrid = new Array<number>();
            epochGrid.push(start);
            let value = start;
            while (value < end) {
                let lineAt = new Date(value);
                lineAt.setDate(1);
                lineAt.setHours(0);
                lineAt.setMinutes(0);
                lineAt.setSeconds(0);
                lineAt.setMilliseconds(0);
                if (basis === 'month') {
                    lineAt.setMonth((lineAt.getMonth() + 1) % 12);
                    if (lineAt.valueOf() < value) {
                        lineAt.setFullYear(lineAt.getFullYear() + 1);
                    }
                } else {
                    lineAt.setMonth(0);
                    lineAt.setFullYear(lineAt.getFullYear() + 1);
                }
                value = lineAt.valueOf();
                if (value < end) {
                    epochGrid.push(value);
                }
            }
            epochGrid.push(end);
            const relativeEpochGrid = epochGrid.map((v) => v - start);
            const screenGrid = relativeEpochGrid.map((v) => offset.left + v * (offset.width / (end - start)));
            return screenGrid;
        };
    };
    if (companies.some((company) => company.err !== undefined)) {
        companies.filter((company) => company.err !== undefined).forEach((company) => console.log(company.err));
        return (
            <article className={isLarge ? 'heroic error' : 'error'}>Error fetching forecast</article>
        )
    } else if (yMin === undefined || yMax === undefined) {
        return (<article className={isLarge ? 'heroic loading' : 'loading'}></article>);
    } else {
        return (
            <article className={isLarge ? 'heroic' : undefined}>
                {title !== undefined && (<div className="title">{title}</div>)}
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData} margin={!isLarge ? { top: 0, right: 0, bottom: 0, left: 0 } : undefined}>
                        <CartesianGrid verticalCoordinatesGenerator={isLarge ? temporalGridGen('month') : temporalGridGen('year')} />
                        {companies.map((company) => (
                            <Line name={company.name}
                                type="linear"
                                isAnimationActive={false}
                                dataKey={company.id}
                                stroke={company.colour}
                                dot={false} />
                        ))}
                        {isLarge && <Tooltip
                            isAnimationActive={false}
                            formatter={priceFormatter}
                            labelFormatter={datetimeFormatter}
                            contentStyle={{ fontSize: '0.6rem', backgroundColor: '#eeee', borderRadius: '0.6rem', borderWidth: 1 }}
                            wrapperStyle={{ zIndex: 200 }}
                            allowEscapeViewBox={{ x: false, y: true }}
                        />}
                        {isLarge && <Legend
                            verticalAlign="top"
                            iconType='plainline'
                            wrapperStyle={{ fontSize: '0.5rem', padding: '0.5rem' }} />}
                        <XAxis hide={!isLarge}
                            dataKey="x"
                            type="number"
                            tick={{ fontSize: '0.4rem' }}
                            tickFormatter={dateFormatter}
                            height={15}
                            scale="linear"
                            allowDecimals={false}
                            domain={[firstCompany.xMin.valueOf(), firstCompany.xMax.valueOf()]} />
                        <YAxis hide={!isLarge}
                            dataKey={firstCompany.id}
                            tick={{ fontSize: '0.4rem' }}
                            tickFormatter={priceFormatter}
                            width={35}
                            type='number'
                            scale='linear'
                            domain={[yMin, yMax]} />
                    </LineChart>
                </ResponsiveContainer>
                <aside>
                    <nav>
                        <ul>
                            {onPin !== undefined && (<li><div className="button pin" onClick={onPin} /></li>)}
                            {onClose !== undefined && (<li><div className="button hide" onClick={onClose} /></li>)}
                        </ul>
                    </nav>
                </aside>
            </article>
        );
    }
}