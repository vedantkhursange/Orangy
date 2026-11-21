"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="orange-ring mt-5 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white">
      Print / Save as PDF
    </button>
  );
}
