/*
  TODO:
    - smooth the angle by taking weighted average of past positions
    - use dynamic SVG to render proper shadow for all angles
    - fix TS errors

*/

import React, { useEffect, useRef } from "react";
import "./styles.css";

export default function App() {
  return (
    <div className="App">
      <Cursor />
      <h1>Adaptive Cursor</h1>
      <h2>Cursor angle adapts to the direction where it is heading.</h2>
    </div>
  );
}

type Point = { x: number; y: number };

const sum = (a: Point, b: Point) => ({ x: a.x + b.x, y: a.y + b.y });
const divide = (a: Point, s: number) => ({ x: a.x / s, y: a.y / s });
const average = (a: Point[]) => divide(a.reduce(sum), a.length);
const angle = (a: Point, b: Point) =>
  (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
const takeRight = (a: any[], n = 1) => a.slice(Math.max(a.length - n, 0));

const getPositionFromMouseEvent = (e: MouseEvent) => ({
  x: e.clientX,
  y: e.clientY,
});
const getPositionFromTouchEvent = (e: TouchMoveEvent) => ({
  x: e.touches[0].clientX,
  y: e.touches[0].clientY,
});

function Cursor() {
  const cursorRef = useRef<SVGSVGElement>(null);
  const previousPositionsRef = useRef<Point[]>([]);
  const windowLength = 30;

  const mutateCursorStyle = (position: Point, angle: number) => {
    const cursorEl = cursorRef.current;
    if (cursorEl !== null) {
      cursorEl.style.top = `${position.y}px`;
      cursorEl.style.left = `${position.x}px`;

      // const normalizedAngle = (angle + 450) % 360

      // cursorEl.style.filter = `drop-shadow(0 ${
      //   (angle + 90) > 90 ? "1px" : "-1px"
      // } 1px rgba(0, 0, 0, .4))`;

      // ugh
      cursorEl.style.transform = `translate(-10px, -9px) rotate(20deg) rotate(${
        angle + 90
      }deg)`;
    }
  };

  const hideRealCursor = () => {
    const el = document.documentElement;
    const originalCursor = el.style.cursor;

    el.style.cursor = "none";

    return () => {
      el.style.cursor = originalCursor;
    };
  };

  const moveFakeCursor = () => {
    const onMouseMove = (e: MouseEvent) => {
      const previousPositions = previousPositionsRef.current;
      const currentPosition = getPositionFromMouseEvent(e);

      previousPositions.push(currentPosition);

      mutateCursorStyle(
        currentPosition,
        angle(average(previousPositions), currentPosition)
      );

      previousPositionsRef.current = takeRight(previousPositions, windowLength);
    };

    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  };

  const moveFakeCursorViaTouch = () => {
    const onTouchMove = (e: TouchEvent) => {
      const previousPositions = previousPositionsRef.current;
      const currentPosition = getPositionFromTouchEvent(e);

      previousPositions.push(currentPosition);

      mutateCursorStyle(
        currentPosition,
        angle(average(previousPositions), currentPosition)
      );

      previousPositionsRef.current = takeRight(previousPositions, windowLength);
    };

    document.addEventListener("touchmove", onTouchMove);

    return () => {
      document.removeEventListener("mousemove", onTouchMove);
    };
  };

  useEffect(moveFakeCursorViaTouch, []);
  useEffect(moveFakeCursor, []);
  useEffect(hideRealCursor, []);

  return (
    <svg
      ref={cursorRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 28 28"
      width={28}
      height={28}
      style={{
        position: "fixed",
        transition: "transform 10ms linear",
        filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, .4))",
        transformOrigin: "10px 9px",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <polygon
        fill="#FFFFFF"
        points="8.2,20.9 8.2,4.9 19.8,16.5 13,16.5 12.6,16.6 "
      />
      <polygon fill="#FFFFFF" points="17.3,21.6 13.7,23.1 9,12 12.7,10.5 " />
      <rect
        x="12.5"
        y="13.6"
        transform="matrix(0.9221 -0.3871 0.3871 0.9221 -5.7605 6.5909)"
        width="2"
        height="8"
      />
      <polygon points="9.2,7.3 9.2,18.5 12.2,15.6 12.6,15.5 17.4,15.5 " />
    </svg>
  );
}
