import React from 'react';
import Chart from 'react-apexcharts';
import { withTheme } from '@material-ui/styles';

const UniqueRecordsChart = ({ labels, series, title, theme }) => {
    const isDarkTheme = theme.palette.type === 'dark';

    return (
        <Chart
            options={{
                xaxis: {
                    categories: labels,
                },
                legend: {
                    show: false,
                },
                dataLabels: {
                    enabled: false,
                },
                chart: {
                    toolbar: {
                        show: false,
                    },
                    foreColor: isDarkTheme ? 'white' : 'black',
                },
                tooltip: {
                    theme: isDarkTheme ? 'dark' : 'light',
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
                    bar: {
                        horizontal: true,
                    },
                },
            }}
            series={series}
            type="bar"
            height="800"
        />
    );
};

export default withTheme(UniqueRecordsChart);
