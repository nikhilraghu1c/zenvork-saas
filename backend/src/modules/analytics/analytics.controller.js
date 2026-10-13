import { tenantId } from "../../utils/tenant-scope.js";
import {
  getReportingMonthRange,
  REPORTING_PERIODS,
  getReportingRange,
} from "../../utils/reporting-period.js";
import { getRevenueAnalyticsReport } from "./services/revenue-reporting.service.js";

const getRevenueAnalytics = async (req, res) => {
  try {
    const period = req.query.period ?? "month";
    const selectedMonth = req.query.month;
    // Analytics accepts fixed windows or one server-validated whole calendar month.
    if (typeof period !== "string" || !REPORTING_PERIODS.includes(period)) {
      return res.status(400).json({ message: "Period must be today, week, or month" });
    }
    if (selectedMonth !== undefined && (period !== "month" || typeof selectedMonth !== "string")) {
      return res.status(400).json({ message: "Month can only be used with the month period" });
    }

    const reportingRange =
      selectedMonth !== undefined ? getReportingMonthRange(selectedMonth) : getReportingRange(period);
    if (!reportingRange) {
      return res.status(400).json({ message: "Month must be within the current and previous 35 months" });
    }

    const analytics = await getRevenueAnalyticsReport({
      businessId: tenantId(req),
      period,
      month: selectedMonth,
      reportingRange,
    });
    return res.status(200).json({ analytics });
  } catch (error) {
    console.error("Failed to load revenue analytics:", error);
    return res.status(500).json({ message: "Unable to load revenue analytics" });
  }
};

export { getRevenueAnalytics };
