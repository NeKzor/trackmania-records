import React from 'react';
import Chart from 'react-apexcharts';
import { withTheme } from '@material-ui/styles';

const RecordsChart = ({ labels, series, title, theme }) => {
    const isDarkTheme = theme.palette.type === 'dark';

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
            }}
            series={series}
            type="donut"
            height="400"
        />
    );
};

export default withTheme(RecordsChart);
