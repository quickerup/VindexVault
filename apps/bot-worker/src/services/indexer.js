
const reports = [];
const links = [];

function addReport(report) {
  reports.push(report);
  return report.id;
}

function addLink(link) {
  links.push(link);
  return link.from + "->" + link.to;
}

function getReports() {
  return reports;
}

function getLinks() {
  return links;
}

module.exports = { addReport, addLink, getReports, getLinks };
