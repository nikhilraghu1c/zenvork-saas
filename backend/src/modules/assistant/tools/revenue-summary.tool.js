import { getRevenueAnalyticsReport } from "../../analytics/services/revenue-reporting.service.js";
import { getReportingDateRange } from "../../../utils/reporting-period.js";
import {
  AssistantToolAuthorizationError,
  AssistantToolValidationError,
} from "./assistant-tool.errors.js";

// Uses server-derived actor and tenant data so an AI request cannot choose a business or bypass owner reporting access.
const getRevenueSummary = async ({ businessId, userRole, fromDate, toDate }) => {
  if (userRole !== "OWNER") {
    throw new AssistantToolAuthorizationError(
      "Only the business owner can access revenue information",
    );
  }

  const reportingRange = getReportingDateRange({ fromDate, toDate });
  if (!reportingRange) {
    throw new AssistantToolValidationError(
      "Please provide a valid past date or date range within the supported reporting period",
    );
  }

  const report = await getRevenueAnalyticsReport({
    businessId,
    period: "custom",
    reportingRange,
  });

  return {
    fromDate,
    toDate,
    billedPaise: report.revenue.billedPaise,
    billedBookingsCount: report.revenue.billedBookingsCount,
    collectedPaise: report.revenue.collectedPaise,
    collectedBookingsCount: report.revenue.collectedBookingsCount,
    pendingPaymentPaise: report.revenue.outstandingPaise,
    pendingPaymentBookingsCount: report.revenue.outstandingBookingsCount,
  };
};

export { getRevenueSummary };
