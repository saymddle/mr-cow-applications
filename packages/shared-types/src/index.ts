/**
 * Named types for the TOGIVA Core v1 API.
 *
 * Everything here is derived from `src/generated/schema.ts`, which
 * openapi-typescript generates from `openapi/v1.json` (a copy of TOGIVA Core's
 * published contract). To update: `pnpm api:sync && pnpm api:generate`.
 */
import type { operations, paths } from "./generated/schema";

export type { operations, paths };

type Ok<R> = R extends { 200: { content: { "application/json": infer B } } }
  ? B
  : R extends { 201: { content: { "application/json": infer B } } }
    ? B
    : never;

/** Success body of an operation, by operationId. */
export type ResponseOf<Op extends keyof operations> = Ok<operations[Op]["responses"]>;
/** JSON request body of an operation, by operationId. */
export type RequestBodyOf<Op extends keyof operations> = operations[Op] extends {
  requestBody?: { content: { "application/json": infer B } };
}
  ? B
  : never;

export type Me = ResponseOf<"getMe">;
export type StaffMembership = Me["staffMemberships"][number];
export type CustomerMembership = Me["customerMemberships"][number];
export type OrganizationSummary = ResponseOf<"getOrganizationBySlug">;
export type Permission = StaffMembership["organizationPermissions"][number];
export type LocationSummary = ResponseOf<"getLocation">;
export type LocationPage = ResponseOf<"listLocations">;
export type EnrollmentRequest = RequestBodyOf<"enroll">;
export type IssuedConnectionCode = ResponseOf<"issueConnectionCode">;
export type ConnectionCodeState = ResponseOf<"getCurrentConnectionCode">;
export type ConnectionCodeReservation = ResponseOf<"lookupConnectionCode">;
export type TransactionAssociation = ResponseOf<"associateOrder">;
export type Wallet = ResponseOf<"getWallet">;
export type ActivityPage = ResponseOf<"listActivity">;
export type RewardPage = ResponseOf<"listRewards">;
export type ActivityItem = ActivityPage["items"][number];
export type RewardSummary = RewardPage["items"][number];
export type RewardIneligibleReason = NonNullable<RewardSummary["eligibility"]>["reasons"][number];
export type IssuedRedemption = ResponseOf<"issueRedemption">;
export type IssueRedemptionRequest = RequestBodyOf<"issueRedemption">;
export type CustomerRedemptionPage = ResponseOf<"listMyRedemptions">;
export type CustomerRedemption = CustomerRedemptionPage["items"][number];
export type RedemptionVerification = ResponseOf<"verifyRedemption">;
export type AdjustmentRequestSummary = ResponseOf<"requestAdjustment">;
export type HealthResponse = ResponseOf<"health">;

/** Error envelope every TOGIVA Core error response uses. */
export interface ApiErrorBody {
  error: { code: string; message: string; requestId?: string; details?: unknown; retryAfterSeconds?: number };
}
