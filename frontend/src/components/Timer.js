/**
 * components/Timer.js
 *
 * Live countdown timer to 11:00 AM ordering deadline.
 * - Premium animated circular progress rings for H / M / S
 * - Glassmorphism card with gradient glow effects
 * - Pulsing particle dots & smooth micro-animations
 * - Shows "Orders Closed" banner once deadline has passed
 * - Calls onStatusChange(isOpen) whenever open/closed status changes
 */

import React, { useState, useEffect, useCallback } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const DEADLINE_HOUR = 11; // 11:00 AM
const DEADLINE_MINUTE = 0;

// Set to true to disable the 11:00 AM ordering restriction (orders will be open 24/7)
const DISABLE_DEADLINE = true;

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

// ── Circular Progress Ring ────────────────────────────────────────────────────
const CircleRing = ({ value, maxValue, label, displayValue, isUrgent, delay = 0 }) => {
  const size = 100;
  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = maxValue > 0 ? (value / maxValue) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className="flex flex-col items-center animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-1000"
          style={{
            background: isUrgent
              ? "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(230,92,0,0.12) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />

        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ filter: isUrgent ? "drop-shadow(0 0 6px rgba(239,68,68,0.4))" : "drop-shadow(0 0 6px rgba(230,92,0,0.3))" }}
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Animated progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isUrgent ? "url(#urgentGradient)" : "url(#normalGradient)"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="normalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E65C00" />
              <stop offset="50%" stopColor="#F9A825" />
              <stop offset="100%" stopColor="#FF6B1A" />
            </linearGradient>
            <linearGradient id="urgentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-display text-2xl sm:text-3xl font-bold tabular-nums tracking-tight transition-colors duration-500
              ${isUrgent ? "text-red-400" : "text-white"}`}
          >
            {pad(displayValue)}
          </span>
        </div>
      </div>

      {/* Label */}
      <span
        className={`text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] mt-2 transition-colors duration-500
          ${isUrgent ? "text-red-400/70" : "text-gray-500"}`}
      >
        {label}
      </span>
    </div>
  );
};

// ── Separator Dots ────────────────────────────────────────────────────────────
const SeparatorDots = ({ isUrgent }) => (
  <div className="flex flex-col items-center gap-2 pb-5">
    <div
      className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 animate-pulse
        ${isUrgent ? "bg-red-400" : "bg-canteen-primary"}`}
    />
    <div
      className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 animate-pulse
        ${isUrgent ? "bg-red-400/60" : "bg-canteen-secondary/60"}`}
      style={{ animationDelay: "300ms" }}
    />
  </div>
);

// ── Floating Particles ────────────────────────────────────────────────────────
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-canteen-primary/20 animate-float"
        style={{
          left: `${15 + i * 18}%`,
          top: `${20 + (i % 3) * 25}%`,
          animationDelay: `${i * 1.2}s`,
          animationDuration: `${4 + i * 0.8}s`,
        }}
      />
    ))}
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
      <div className="relative overflow-hidden animate-fade-in">
        {/* Background glow */}
        <div className="absolute inset-0 rounded-2xl" style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)",
        }} />

        <div className="relative glass border border-red-500/20 rounded-2xl p-6 sm:p-8">
          <FloatingParticles />

          <div className="flex flex-col items-center text-center gap-4">
            {/* Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-2xl blur-xl" />
              <div className="relative w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <span className="text-3xl">🚫</span>
              </div>
            </div>

            {/* Text */}
            <div>
              <p className="font-display text-lg sm:text-xl font-bold text-red-400">
                Orders Closed for Today
              </p>
              <p className="text-gray-500 text-sm mt-1.5">
                Pre-ordering reopens tomorrow before{" "}
                <span className="text-red-400/80 font-semibold">11:00 AM</span>
              </p>
            </div>

            {/* Status pill */}
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/15 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400/80 text-xs font-semibold uppercase tracking-wider">
                Closed
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Countdown State ─────────────────────────────────────────────────────────
  return (
    <div className="relative overflow-hidden animate-fade-in">
      {/* Background ambient glow */}
      <div className="absolute inset-0 rounded-2xl" style={{
        background: isUrgent
          ? "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(249,115,22,0.04) 50%, rgba(239,68,68,0.06) 100%)"
          : "linear-gradient(135deg, rgba(230,92,0,0.06) 0%, rgba(249,168,37,0.04) 50%, rgba(15,52,96,0.06) 100%)",
      }} />

      <div
        className={`relative glass rounded-2xl p-5 sm:p-7 border transition-all duration-700
          ${isUrgent ? "border-red-500/25" : "border-canteen-primary/15"}`}
      >
        <FloatingParticles />

        {/* Header row */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div className="flex items-center gap-2.5">
            {/* Status indicator */}
            <div className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-500
              ${isUrgent ? "bg-red-500/10" : "bg-canteen-primary/10"}`}
            >
              <span className={`text-lg ${isUrgent ? "animate-bounce" : ""}`}>
                {isUrgent ? "⏰" : "🕐"}
              </span>
            </div>
            <div>
              <p className={`text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors duration-500
                ${isUrgent ? "text-red-400" : "text-canteen-secondary"}`}
              >
                Order Deadline
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {isUrgent ? "Hurry! Closing soon" : "Place your order before"}
              </p>
            </div>
          </div>

          {/* Deadline badge */}
          <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border transition-all duration-500
            ${isUrgent
              ? "bg-red-500/10 border-red-500/20"
              : "bg-canteen-primary/10 border-canteen-primary/20"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-500
              ${isUrgent ? "bg-red-500" : "bg-canteen-primary"}`}
            />
            <span className={`text-sm sm:text-base font-bold font-display transition-colors duration-500
              ${isUrgent ? "text-red-400" : "text-canteen-primary"}`}
            >
              11:00 AM
            </span>
          </div>
        </div>

        {/* Ring countdown display */}
        <div className="flex items-center justify-center gap-3 sm:gap-5">
          <CircleRing
            value={timeLeft.hoursLeft}
            maxValue={24}
            label="Hours"
            displayValue={timeLeft.hoursLeft}
            isUrgent={isUrgent}
            delay={0}
          />

          <SeparatorDots isUrgent={isUrgent} />

          <CircleRing
            value={timeLeft.minutesLeft}
            maxValue={60}
            label="Minutes"
            displayValue={timeLeft.minutesLeft}
            isUrgent={isUrgent}
            delay={100}
          />

          <SeparatorDots isUrgent={isUrgent} />

          <CircleRing
            value={timeLeft.secondsLeft}
            maxValue={60}
            label="Seconds"
            displayValue={timeLeft.secondsLeft}
            isUrgent={isUrgent}
            delay={200}
          />
        </div>

        {/* Progress bar at bottom */}
        <div className="mt-5 sm:mt-6">
          <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out
                ${isUrgent
                  ? "bg-gradient-to-r from-red-500 via-orange-500 to-red-500"
                  : "bg-gradient-to-r from-canteen-primary via-canteen-secondary to-canteen-glow"
                }`}
              style={{
                width: `${Math.min(100, (timeLeft.totalSecondsLeft / (DEADLINE_HOUR * 3600)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;
