"use client";

import { useState, useEffect, useCallback } from "react";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Smart Task Routing",
    description:
      "Describe your goal in plain language. Our AI routes tasks to the optimal execution engine — Devin for code generation, Convex for real-time data, or Context.dev for knowledge retrieval.",
    icon: (
      <svg className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
  {
    title: "Live Collaboration",
    description:
      "Work alongside AI agents in real time. See suggestions appear as they are generated, refine outputs on the fly, and maintain full creative control over every decision.",
    icon: (
      <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.904 5.904 0 0112 15c-1.943 0-3.744.412-5.345 1.129m0 0l.03-.002a6.713 6.713 0 01-1.044-1.415m0 0A5.971 5.971 0 007.059 12m0 0a5.971 5.971 0 00.941 3.197m0 0A5.904 5.904 0 0112 21c1.943 0 3.744-.412 5.345-1.129m0 0l-.03.002a6.713 6.713 0 001.044 1.415m0 0A5.971 5.971 0 0116.941 12m0 0a5.971 5.971 0 00-.941-3.197m0 0A5.904 5.904 0 0112 15" />
      </svg>
    ),
  },
  {
    title: "Model Relay System",
    description:
      "Seamlessly switch between Kimi K3, Qwen 3.8 Max, GLM 5.3, Claude, and Devin each model assigned to its strongest task type. No manual context switching needed.",
    icon: (
      <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: "Integrated Toolchain",
    description:
      "Devin generates production-ready code, Convex provides instant real-time sync without servers, and Context.dev indexes your entire codebase for intelligent recall.",
    icon: (
      <svg className="h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1h13.16M3.3 20.03h.01m17.09 0h.01M5.6 17.6h.01m13.19 0h.01M7.9 15.3h.01m12.89 0h.01M10.2 12.99h.01m8.29 0h.01M12.5 10.69h.01M14.8 8.39h.01m2.3 2.3h.01M19.4 13h.01M8.3 4.99h.01m-2.3 2.3h.01M4.3 8.39h.01m0 4.6h.01" />
      </svg>
    ),
  },
  {
    title: "Ship in Hours, Not Weeks",
    description:
      "From idea to deployed prototype in under 6 hours. Our guided workflow handles setup, scaffolding, and integration so you focus on what makes your project unique.",
    icon: (
      <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
];

export default function Tour({ initialStep = 0 }: { initialStep?: number }) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isOpen, setIsOpen] = useState(true);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const totalSteps = TOUR_STEPS.length;
  const current = TOUR_STEPS[currentStep];

  const goToNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setDirection("forward");
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const goToPrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection("backward");
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeTour();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToNext, goToPrev, closeTour]);

  const handleCloseClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      closeTour();
    },
    [closeTour]
  );

  if (!isOpen) return null;

  return (
    <div className="tour-overlay" onClick={handleCloseClick}>
      <div
        className={`tour-modal ${
          direction === "forward" ? "animate-slide-up" : "animate-slide-down"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Product tour"
      >
        {/* Close button */}
        <button
          onClick={handleCloseClick}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          aria-label="Close tour"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="mb-6 flex items-center gap-1.5">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`tour-step-indicator ${
                i === currentStep
                  ? "flex-1 bg-brand-400"
                  : i < currentStep
                  ? "w-2.5 bg-brand-700/60"
                  : "w-2.5 bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Step counter */}
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-brand-400/80">
          Step {currentStep + 1} of {totalSteps}
        </p>

        {/* Icon */}
        <div className="mb-4">{current.icon}</div>

        {/* Title */}
        <h2 className="mb-3 text-2xl font-semibold text-white sm:text-3xl">
          {current.title}
        </h2>

        {/* Description */}
        <p className="mb-8 leading-relaxed text-slate-400">{current.description}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrev}
            disabled={currentStep === 0}
            className={`${
              currentStep === 0
                ? "cursor-default text-slate-700"
                : "tour-btn-secondary !py-2"
            }`}
            aria-label="Previous step"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {currentStep === totalSteps - 1 ? (
            <button onClick={closeTour} className="tour-btn-primary !py-2">
              Get Started
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          ) : (
            <button onClick={goToNext} className="tour-btn-primary !py-2">
              Next
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
