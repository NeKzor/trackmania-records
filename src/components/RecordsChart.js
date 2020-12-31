import React from 'react';
import Chart from 'react-apexcharts';
import { withTheme } from '@material-ui/styles';

const randomColor = () => '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');

const MAX_DATAPOINTS = 30;

const RecordsChart = ({ labels, series, title, theme, rest = true }) => {
    const isDarkTheme = theme.palette.type === 'dark';

    if (rest && series.length > MAX_DATAPOINTS) {
        const rest = series.slice(MAX_DATAPOINTS).reduce((acc, val) => (acc += val), 0);

        series = series.slice(0, MAX_DATAPOINTS);
        labels = labels.slice(0, MAX_DATAPOINTS);

        series.push(rest);
        labels.push('Rest');
    }

    const colors = new Array(series.length).fill(0).map(() => randomColor());

    return (
        <Chart
            options={{
                labels,
                legend: {
                    show: false,
                },
                responsive: [
                    {
                        breakpoint: 380,
                        options: {
                            chart: {
                                height: '300px',
                            },
                        },
                    },
                ],
                plotOptions: {
                    pie: {
                        donut: {
                            labels: {
                                show: true,
                                name: {
                                    show: true,
                                },
                                value: {
                                    show: true,
                                    color: isDarkTheme ? 'white' : 'black',
                                },
                                total: {
                                    show: true,
                                    label: title,
                                    color: isDarkTheme ? 'white' : 'black',
                                },
                            },
                        },
                    },
                },
                colors,
            }}
            series={series}
            type="donut"
            height="400"
        />
    );
};

export default withTheme(RecordsChart);
