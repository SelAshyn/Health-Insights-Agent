export interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export interface Step {
  num: string;
  icon?: React.ReactNode;
  title: string;
  desc: string;
  last?: boolean;
}

export interface Stat {
  num: React.ReactNode;
  label: string;
}

export interface ReportRow {
  name: string;
  ref: string;
  val: string;
  status: "low" | "high" | "ok";
}

export type StatusStyle = {
  val: string;
  tag: string;
  label: string;
};
