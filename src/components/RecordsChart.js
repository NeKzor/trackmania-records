import React from 'react';
import Chart from 'react-apexcharts';

const RecordsChart = ({ labels, series, title }) => {
    return (
        <Chart
            options={{
                labels,
                legend: {
                    show: false,
                    position: 'left',
                    labels: {
                        useSeriesColors: true,
                    },
                },
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
                                    color: 'white'
                                },
                                total: {
                                    show: true,
                                    label: title,
                                    color: 'white'
                                }
                            },
                        },
                    },
                },
            }}
            series={series}
            type="donut"
            width="400"
            height="400"
        />
    );
};

export default RecordsChart;
