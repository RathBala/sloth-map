import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SlothMap = () => {
    const ref = useRef();

    useEffect(() => {
        drawChart();
    }, []);

    const drawChart = () => {
        const svg = d3
            .select(ref.current)
            .attr('width', 800)
            .attr('height', 200);

        const nodes = [
            { id: 1, type: 'rect', date: 'June 2024' },
            { id: 2, type: 'rect', date: 'July 2024' },
            { id: 3, type: 'circle', date: 'August 2024' },
        ];

        const nodeElements = svg
            .selectAll('g')
            .data(nodes)
            .enter()
            .append('g')
            .attr('transform', (d, i) => `translate(${200 * i + 100}, 100)`);

        nodeElements
            .filter((d) => d.type === 'rect')
            .append('rect')
            .attr('width', 100)
            .attr('height', 50)
            .attr('rx', 10)
            .attr('ry', 10)
            .style('fill', 'lightblue');

        nodeElements
            .filter((d) => d.type === 'circle')
            .append('circle')
            .attr('cx', 50)
            .attr('cy', 25)
            .attr('r', 25)
            .style('fill', 'lightgreen');

        nodeElements
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('x', 50)
            .attr('y', -20)
            .text((d) => d.date);

        nodeElements
            .filter((_, i) => i < nodes.length - 1)
            .append('path')
            .attr('d', (d, i) => {
                const startX = 200 * i + 100; // 100 for the translation and 100 for the rectangle's width
                let endX = 200 * i + 100 + 100; // Center of the next node group
                const centerY = 25; // Vertical center of the shapes

                // If the next node is a circle, adjust the endX to stop at the circle's edge
                if (nodes[i + 1] && nodes[i + 1].type === 'circle') {
                    endX = 200 * (i + 1) + 100 - 25; // Adjust endX to account for the circle's radius
                }

                return `M ${startX},${centerY} L ${endX},${centerY}`;
            })
            .attr('stroke', 'gray')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('fill', 'none')
            .style('animation', 'dash 1s linear infinite');

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
