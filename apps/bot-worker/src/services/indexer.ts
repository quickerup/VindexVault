import { ThreatReport, GraphLink } from "../../../packages/shared-types";

const reports: ThreatReport[] = [];
const links: GraphLink[] = [];

export function addReport(report: ThreatReport) {
  reports.push(report);
  return report.id;
}

export function addLink(link: GraphLink) {
  links.push(link);
  return `${link.from}->${link.to}`;
}

export function getReports() {
  return reports;
}

export function getLinks() {
  return links;
}
