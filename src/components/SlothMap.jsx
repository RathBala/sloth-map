import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SlothMap = ({ data }) => {
    const ref = useRef();

    useEffect(() => {
        drawChart();
    }, [data]);

    const drawChart = () => {
        const svg = d3
            .select(ref.current)
            .attr('width', 1000)
            .attr('height', 300);

        const nodeElements = svg
            .selectAll('g')
            .data(data)
            .enter()
            .append('g')
            .attr('transform', (d, i) => `translate(${250 * i + 50}, 100)`);

        nodeElements
            .filter((d) => d.type === 'rect')
            .append('rect')
            .attr('width', 150)
            .attr('height', 70)
            .attr('rx', 10)
            .attr('ry', 10)
            .style('fill', 'lightblue');

        nodeElements
            .filter((d) => d.type === 'circle')
            .append('circle')
            .attr('cx', 75)
            .attr('cy', 35)
            .attr('r', 35)
            .style('fill', 'lightgreen');

        nodeElements
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('x', 75)
            .attr('y', -20)
            .text((d) => d.date);

        nodeElements
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('x', 75)
            .attr('y', -5)
            .text((d) => `£${d.grandTotal.toFixed(2)}`);

        nodeElements
            .append('foreignObject')
            .attr('x', (d) => (d.type === 'circle' ? 35 : 15)) // Adjust x position for circles
            .attr('y', (d) => (d.type === 'circle' ? 10 : 15)) // Adjust y position for circles
            .attr('width', (d) => (d.type === 'circle' ? 80 : 120)) // Adjust width for circles
            .attr('height', 50)
            .append('xhtml:div')
            .style('text-align', 'center')
            .style('font-size', '12px')
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .style('height', '100%')
            .html((d) => d.text.split(';').join('<br>'));

        data.forEach((d, i) => {
            if (i < data.length - 1) {
                const currentType = d.type;
                const nextType = data[i + 1].type;

                let startX = currentType === 'circle' ? 160 : 200;
                let endX =
                    nextType === 'circle'
                        ? 250 * (i + 1) + 90
                        : 250 * (i + 1) + 50;

                const centerY = 135;

                svg.append('path')
                    .attr(
                        'd',
                        `M ${250 * i + startX},${centerY} L ${endX},${centerY}`
                    )
                    .attr('stroke', 'gray')
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '5,5')
                    .attr('fill', 'none')
                    .style('animation', 'dash 1s linear infinite');
            }
        });

        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes dash {
                to {
                    stroke-dashoffset: -10;
                }
            }
        `;
        document.getElementsByTagName('head')[0].appendChild(style);
    };

    return <svg ref={ref}></svg>;
};

export default SlothMap;
