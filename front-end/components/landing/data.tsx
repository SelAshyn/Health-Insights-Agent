import { Feature, ReportRow, Stat, StatusStyle, Step } from "@/types/landing";
import { IconBrain, IconChat, IconFile, IconGrid, IconHistory, IconMessageCircle, IconUpload } from "./icons";

export const reportRows: ReportRow[] = [
  { name: "Hemoglobins",     ref: "Ref: 13.5–17.5 g/dL", val: "11.2", status: "low"  },
  { name: "WBC Count",      ref: "Ref: 4.0–11.0 K/uL",  val: "11.8", status: "high" },
  { name: "Platelet Count", ref: "Ref: 150–400 K/uL",   val: "285",  status: "ok"   },
];

export const statusStyles: Record<ReportRow["status"], StatusStyle> = {
  low:  { val: "text-blue-700", tag: "bg-blue-50 text-blue-700", label: "Low"    },
  high: { val: "text-red-700",  tag: "bg-red-50 text-red-700",   label: "High"   },
  ok:   { val: "text-teal-700", tag: "bg-teal-50 text-teal-700", label: "Normal" },
};

export const features: Feature[] = [
  {
    icon: <IconGrid />,
    title: "Structured report analysis",
    desc: "Every biomarker is extracted, compared against reference ranges, and explained — not just flagged as high or low.",
  },
  {
    icon: <IconChat />,
    title: "Follow-up chat",
    desc: "Ask anything about your report in plain language. The chat agent keeps full context of your report and prior analysis.",
  },
  {
    icon: <IconFile />,
    title: "Pre-loaded sample reports",
    desc: "No report on hand? Try with one of our built-in sample reports — CBC, lipid panel, thyroid, and more.",
  },
  {
    icon: <IconHistory />,
    title: "Session history",
    desc: "All sessions are saved locally. Switch between past analyses, review previous chats, and pick up exactly where you left off.",
  },
];

export const steps: Step[] = [
  {
    num: "01",
    icon: <IconUpload />,
    title: "Upload your report",
    desc: "Drop a PDF blood report or choose from our pre-loaded sample reports. Up to 20 MB, 50 pages.",
  },
  {
    num: "02",
    icon: <IconBrain />,
    title: "AI analyzes it",
    desc: "Our analysis agent reads every biomarker, flags abnormal values, and explains what each one means in plain language.",
  },
  {
    num: "03",
    icon: <IconMessageCircle />,
    title: "Ask anything",
    desc: "Chat with the report. Ask why a value is low, what it implies, or what questions to bring to your doctor.",
    last: true,
  },
];

export const stats: Stat[] = [
  { num: <>15<span className="text-teal-400"> +</span></>,          label: "Biomarkers analyzed per report"  },
  { num: <><span className="text-teal-400">&lt; </span>10s</>,      label: "Average time to full analysis"   },
  { num: <>100<span className="text-teal-400"> %</span></>,         label: "Free — no subscription required" },
];
