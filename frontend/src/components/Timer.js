/**
 * components/Timer.js
 *
 * Live countdown timer to 11:00 AM ordering deadline.
 * - Shows HH:MM:SS remaining until cut-off
 * - Turns red and pulses when < 30 minutes remain
 * - Shows "Orders Closed" banner once deadline has passed
 * - Calls onStatusChange(isOpen) whenever open/closed status changes
 *   so parent components can disable order buttons without polling
 */

import React, { useState, useEffect, useCallback } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const DEADLINE_HOUR = 11; // 11:00 AM
const DEADLINE_MINUTE = 0;

// Set to true to disable the 11:00 AM ordering restriction (orders will be open 24/7)
const DISABLE_DEADLINE = false;

/**
 * Returns { isOpen, hoursLeft, minutesLeft, secondsLeft, totalSecondsLeft }
 * based on the current local time vs. the deadline.
 */
const computeTimeLeft = () => {
  const now = new Date();
  let deadline = new Date();
  deadline.setHours(DEADLINE_HOUR, DEADLINE_MINUTE, 0, 0);

  let diffMs = deadline - now;

  if (DISABLE_DEADLINE) {
    // If deadline is disabled, we keep ordering open 24/7.
    // If past today's 11:00 AM, show countdown to tomorrow's 11:00 AM.
    if (diffMs <= 0) {
      deadline.setDate(deadline.getDate() + 1);
      diffMs = deadline - now;
    }
    const totalSecs = Math.floor(diffMs / 1000);
    return {
      isOpen: true,
      hoursLeft: Math.floor(totalSecs / 3600),
      minutesLeft: Math.floor((totalSecs % 3600) / 60),
      secondsLeft: totalSecs % 60,
      totalSecondsLeft: totalSecs,
    };
  }

  if (diffMs <= 0) {
    return { isOpen: false, hoursLeft: 0, minutesLeft: 0, secondsLeft: 0, totalSecondsLeft: 0 };
  }

  const totalSecs = Math.floor(diffMs / 1000);
  return {
    isOpen: true,
    hoursLeft: Math.floor(totalSecs / 3600),
    minutesLeft: Math.floor((totalSecs % 3600) / 60),
    secondsLeft: totalSecs % 60,
    totalSecondsLeft: totalSecs,
  };
};

const pad = (n) => String(n).padStart(2, "0");

// ── Time Box ──────────────────────────────────────────────────────────────────
const TimeBox = ({ value, label, isUrgent }) => (
  <div className="flex flex-col items-center">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-display text-2xl font-bold tabular-nums transition-all duration-500
      ${isUrgent
        ? "bg-red-500/15 text-red-400 border border-red-500/30"
        : "glass border border-canteen-primary/20 text-white"
      }`}
    >
      {pad(value)}
    </div>
    <span className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-wider">{label}</span>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
const Timer = ({ onStatusChange }) => {
  const [timeLeft, setTimeLeft] = useState(computeTimeLeft);

  const tick = useCallback(() => {
    const newTime = computeTimeLeft();
    setTimeLeft((prev) => {
      // Notify parent only when open/closed status actually changes
      if (prev.isOpen !== newTime.isOpen) {
        onStatusChange?.(newTime.isOpen);
      }
      return newTime;
    });
  }, [onStatusChange]);

  // Run onStatusChange once on mount so parent knows initial state
  useEffect(() => {
    onStatusChange?.(timeLeft.isOpen);
    // eslint-disable-next-line
  }, []);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  const isUrgent = timeLeft.isOpen && timeLeft.totalSecondsLeft < 30 * 60; // < 30 min

  // ── Closed State ────────────────────────────────────────────────────────────
  if (!timeLeft.isOpen) {
    return (
      <div className="glass border border-red-500/20 rounded-2xl p-5 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center text-2xl">
            🚫
          </div>
          <div>
            <p className="font-semibold text-red-400 text-sm">Orders closed for today</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Pre-ordering reopens tomorrow before 11:00 AM
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Countdown State ─────────────────────────────────────────────────────────
  return (
    <div
      className={`glass rounded-2xl p-5 border transition-all duration-500
        ${isUrgent
          ? "border-red-500/30 animate-pulse-slow"
          : "border-canteen-primary/15"
        }`}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${isUrgent ? "animate-bounce" : ""}`}>
            {isUrgent ? "⏰" : "🕐"}
          </span>
          <span className={`text-xs font-semibold uppercase tracking-wider ${isUrgent ? "text-red-400" : "text-canteen-secondary"}`}>
            Order deadline
          </span>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${isUrgent ? "text-red-400" : "text-canteen-secondary"}`}>
            11:00 AM
          </p>
        </div>
      </div>

      {/* HH : MM : SS display */}
      <div className="flex items-center justify-center gap-2">
        <TimeBox value={timeLeft.hoursLeft}   label="Hours"   isUrgent={isUrgent} />
        <span className={`text-2xl font-bold pb-5 ${isUrgent ? "text-red-400" : "text-canteen-primary"}`}>:</span>
        <TimeBox value={timeLeft.minutesLeft} label="Minutes" isUrgent={isUrgent} />
        <span className={`text-2xl font-bold pb-5 ${isUrgent ? "text-red-400" : "text-canteen-primary"}`}>:</span>
        <TimeBox value={timeLeft.secondsLeft} label="Seconds" isUrgent={isUrgent} />
      </div>
    </div>
  );
};

export default Timer;
