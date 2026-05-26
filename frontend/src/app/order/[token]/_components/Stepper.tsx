"use client";
import { Check } from "lucide-react";
import React from "react";

interface Step { id: number; label: string; }

export default function Stepper({ current, steps }: { current: number; steps: Step[] }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
              step.id < current
                ? "bg-indigo-600 border-indigo-600 text-white"
                : step.id === current
                ? "bg-white border-indigo-600 text-indigo-600"
                : "bg-white border-gray-200 text-gray-400"
            }`}>
              {step.id < current ? <Check className="h-3 w-3" /> : step.id}
            </div>
            <span className={`text-[10px] font-medium hidden sm:block whitespace-nowrap transition-colors ${
              step.id === current ? "text-indigo-600" : step.id < current ? "text-indigo-400" : "text-gray-400"
            }`}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-3.5 rounded-full transition-all duration-500 ${
              step.id < current ? "bg-indigo-600" : "bg-gray-200"
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
