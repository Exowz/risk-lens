"use client";

/**
 * Efficient Frontier D3.js scatter plot with hover tooltip.
 *
 * Renders the Markowitz frontier curve with annotated portfolio points:
 *   - Frontier curve (line + area)
 *   - Min variance portfolio (green)
 *   - Max Sharpe portfolio (blue)
 *   - Current portfolio (red)
 *
 * Hover tooltip shows nearest frontier point's expected return,
 * volatility, and Sharpe ratio using pure DOM positioning.
 *
 * This is the ONLY D3 component in the project.
 *
 * Depends on: d3, types/markowitz.ts
 * Used by: app/(dashboard)/markowitz/page.tsx
 */

import * as d3 from "d3";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type {
  FrontierPoint,
  PortfolioPoint,
  PortfolioWeights,
} from "@/types/markowitz";

export interface SelectedFrontierPoint {
  point_type: "min_variance" | "max_sharpe" | "current" | "frontier";
  volatility: number;
  expected_return: number;
  sharpe: number;
  weights: Record<string, number>;
}

interface EfficientFrontierProps {
  frontierPoints: FrontierPoint[];
  minVariance: PortfolioWeights;
  maxSharpe: PortfolioWeights;
  currentPortfolio: PortfolioPoint;
  /** Called when user clicks a point or frontier curve */
  onPointClick?: (point: SelectedFrontierPoint) => void;
  /** Current portfolio weights for the "current" point */
  currentWeights?: Record<string, number>;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  expected_return: number;
  volatility: number;
  sharpe: number;
}

const MARGIN = { top: 30, right: 30, bottom: 50, left: 60 };

export function EfficientFrontier({
  frontierPoints,
  minVariance,
  maxSharpe,
  currentPortfolio,
  onPointClick,
  currentWeights,
}: EfficientFrontierProps) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const scalesRef = useRef<{
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
    sorted: FrontierPoint[];
  } | null>(null);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    expected_return: 0,
    volatility: 0,
    sharpe: 0,
  });

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || frontierPoints.length === 0)
      return;

    const draw = () => {
      const container = containerRef.current;
      const svg = d3.select(svgRef.current);
      if (!container) return;

      svg.selectAll("*").remove();

      const width = container.clientWidth;
      const height = Math.min(width * 0.6, 500);

      svg.attr("width", width).attr("height", height);

      const innerWidth = width - MARGIN.left - MARGIN.right;
      const innerHeight = height - MARGIN.top - MARGIN.bottom;

      const allVols = [
        ...frontierPoints.map((p) => p.volatility),
        minVariance.volatility,
        maxSharpe.volatility,
        currentPortfolio.volatility,
      ];
      const allRets = [
        ...frontierPoints.map((p) => p.expected_return),
        minVariance.expected_return,
        maxSharpe.expected_return,
        currentPortfolio.expected_return,
      ];

      const volExtent = d3.extent(allVols) as [number, number];
      const retExtent = d3.extent(allRets) as [number, number];

      const volPad = (volExtent[1] - volExtent[0]) * 0.1 || 0.01;
      const retPad = (retExtent[1] - retExtent[0]) * 0.1 || 0.01;

      const xScale = d3
        .scaleLinear()
        .domain([volExtent[0] - volPad, volExtent[1] + volPad])
        .range([0, innerWidth]);

      const yScale = d3
        .scaleLinear()
        .domain([retExtent[0] - retPad, retExtent[1] + retPad])
        .range([innerHeight, 0]);

      const sorted = [...frontierPoints].sort(
        (a, b) => a.volatility - b.volatility,
      );

      // Store scales for mouse handler
      scalesRef.current = { xScale, yScale, sorted };

      const g = svg
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

      // Grid lines
      g.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(
          d3
            .axisBottom(xScale)
            .tickSize(-innerHeight)
            .tickFormat(() => ""),
        )
        .selectAll("line")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.08);

      g.append("g")
        .attr("class", "grid")
        .call(
          d3
            .axisLeft(yScale)
            .tickSize(-innerWidth)
            .tickFormat(() => ""),
        )
        .selectAll("line")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.08);

      g.selectAll(".grid .domain").remove();

      // X axis
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(
          d3
            .axisBottom(xScale)
            .ticks(6)
            .tickFormat((d) => `${(Number(d) * 100).toFixed(1)}%`),
        )
        .selectAll("text")
        .attr("fill", "currentColor")
        .attr("font-size", "11px");

      // Y axis
      g.append("g")
        .call(
          d3
            .axisLeft(yScale)
            .ticks(6)
            .tickFormat((d) => `${(Number(d) * 100).toFixed(1)}%`),
        )
        .selectAll("text")
        .attr("fill", "currentColor")
        .attr("font-size", "11px");

      // Axis labels
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .attr("fill", "currentColor")
        .attr("font-size", "12px")
        .text(t('charts.annualized_volatility'));

      g.append("text")
        .attr("x", -innerHeight / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("fill", "currentColor")
        .attr("font-size", "12px")
        .text(t('charts.expected_return'));

      // Frontier curve
      const line = d3
        .line<FrontierPoint>()
        .x((d) => xScale(d.volatility))
        .y((d) => yScale(d.expected_return))
        .curve(d3.curveCatmullRom.alpha(0.5));

      const area = d3
        .area<FrontierPoint>()
        .x((d) => xScale(d.volatility))
        .y0(innerHeight)
        .y1((d) => yScale(d.expected_return))
        .curve(d3.curveCatmullRom.alpha(0.5));

      g.append("path")
        .datum(sorted)
        .attr("fill", "hsl(221, 83%, 53%)")
        .attr("fill-opacity", 0.05)
        .attr("d", area);

      g.append("path")
        .datum(sorted)
        .attr("fill", "none")
        .attr("stroke", "hsl(221, 83%, 53%)")
        .attr("stroke-width", 2.5)
        .attr("stroke-opacity", 0.7)
        .attr("d", line);

      // Frontier dots (clickable)
      g.selectAll(".frontier-dot")
        .data(sorted)
        .join("circle")
        .attr("class", "frontier-dot")
        .attr("cx", (d) => xScale(d.volatility))
        .attr("cy", (d) => yScale(d.expected_return))
        .attr("r", 3)
        .attr("fill", "hsl(221, 83%, 53%)")
        .attr("fill-opacity", 0.4)
        .style("cursor", "pointer")
        .on("click", (_e: MouseEvent, d: FrontierPoint) => {
          const s = d.volatility > 0 ? d.expected_return / d.volatility : 0;
          onPointClick?.({
            point_type: "frontier",
            volatility: d.volatility,
            expected_return: d.expected_return,
            sharpe: s,
            weights: {},
          });
        });

      // Annotated points (clickable)
      const drawPoint = (
        x: number,
        y: number,
        color: string,
        label: string,
        yOffset: number,
        clickData?: SelectedFrontierPoint,
      ) => {
        const group = g.append("g").style("cursor", clickData ? "pointer" : "default");

        if (clickData) {
          group.on("click", (e: MouseEvent) => {
            e.stopPropagation();
            onPointClick?.(clickData);
          });
        }

        group
          .append("circle")
          .attr("cx", xScale(x))
          .attr("cy", yScale(y))
          .attr("r", 8)
          .attr("fill", color)
          .attr("fill-opacity", 0.15)
          .attr("stroke", color)
          .attr("stroke-width", 1.5);

        group
          .append("circle")
          .attr("cx", xScale(x))
          .attr("cy", yScale(y))
          .attr("r", 4)
          .attr("fill", color);

        group
          .append("text")
          .attr("x", xScale(x) + 12)
          .attr("y", yScale(y) + yOffset)
          .attr("fill", color)
          .attr("font-size", "11px")
          .attr("font-weight", "600")
          .text(label);
      };

      drawPoint(
        minVariance.volatility,
        minVariance.expected_return,
        "hsl(142, 71%, 45%)",
        t('metrics.expert.min_variance'),
        4,
        {
          point_type: "min_variance",
          volatility: minVariance.volatility,
          expected_return: minVariance.expected_return,
          sharpe: minVariance.sharpe_ratio,
          weights: minVariance.weights,
        },
      );

      drawPoint(
        maxSharpe.volatility,
        maxSharpe.expected_return,
        "hsl(221, 83%, 53%)",
        t('metrics.expert.max_sharpe'),
        -8,
        {
          point_type: "max_sharpe",
          volatility: maxSharpe.volatility,
          expected_return: maxSharpe.expected_return,
          sharpe: maxSharpe.sharpe_ratio,
          weights: maxSharpe.weights,
        },
      );

      const currentSharpe =
        currentPortfolio.volatility > 0
          ? currentPortfolio.expected_return / currentPortfolio.volatility
          : 0;

      drawPoint(
        currentPortfolio.volatility,
        currentPortfolio.expected_return,
        "hsl(0, 84%, 60%)",
        t('charts.current_portfolio'),
        4,
        {
          point_type: "current",
          volatility: currentPortfolio.volatility,
          expected_return: currentPortfolio.expected_return,
          sharpe: currentSharpe,
          weights: currentWeights ?? {},
        },
      );

      g.selectAll(".domain")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.3);
      g.selectAll(".tick line")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.3);
    };

    draw();

    const observer = new ResizeObserver(() => draw());
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
      }
    };
  }, [frontierPoints, minVariance, maxSharpe, currentPortfolio, onPointClick, currentWeights, t]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!scalesRef.current || !containerRef.current) return;

      const { xScale, yScale, sorted } = scalesRef.current;
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - MARGIN.left;
      const mouseY = e.clientY - rect.top - MARGIN.top;

      // Convert pixel to data coordinates
      const dataX = xScale.invert(mouseX);
      const dataY = yScale.invert(mouseY);

      // Find nearest frontier point
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < sorted.length; i++) {
        const dx = sorted[i].volatility - dataX;
        const dy = sorted[i].expected_return - dataY;
        const dist = dx * dx + dy * dy;
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      const nearest = sorted[nearestIdx];
      const riskFreeRate = 0;
      const sharpe =
        nearest.volatility > 0
          ? (nearest.expected_return - riskFreeRate) / nearest.volatility
          : 0;

      setTooltip({
        visible: true,
        x: e.clientX - rect.left + 12,
        y: e.clientY - rect.top - 10,
        expected_return: nearest.expected_return,
        volatility: nearest.volatility,
        sharpe,
      });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  if (frontierPoints.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No frontier data to display.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip.visible && (
        <div
          className="pointer-events-none absolute z-50 rounded-lg border border-border bg-card p-3 shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Expected Return</span>
              <span className="font-mono font-medium">
                {(tooltip.expected_return * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volatility</span>
              <span className="font-mono font-medium">
                {(tooltip.volatility * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Sharpe Ratio</span>
              <span className="font-mono font-medium">
                {tooltip.sharpe.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
