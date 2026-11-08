"use client";
import type { ReactNode } from "react";
import { markSeen, runTrail, type FlowLite } from "@/features/topic/trail";

export default function TrailButton({
  topic,
  index,
  flow,
  className,
  title,
  children,
}: {
  topic: string;
  index: number;
  flow: FlowLite;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      className={className}
      title={title}
      onClick={() => {
        markSeen(topic, index);
        runTrail(flow);
      }}
    >
      {children}
    </button>
  );
}
