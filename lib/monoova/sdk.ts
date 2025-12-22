import { fetchMonoova } from "./client";
import {
  P_FINANCIAL_EXECUTE,
  P_FINANCIAL_STATUS,
  P_FINANCIAL_UNCLEARED,
  P_FINANCIAL_VALIDATE,
  P_PUBLIC_PING,
} from "./paths";

export async function validateTransaction(
  body: Monoova.FinancialTransactionRequest
): Promise<Monoova.ValidateResponse> {
  const { data } = await fetchMonoova(P_FINANCIAL_VALIDATE, {
    method: "POST",
    body,
  });
  return data as Monoova.ValidateResponse;
}

export async function executeTransaction(
  body: Monoova.FinancialTransactionRequest
): Promise<Monoova.ExecuteResponse> {
  const { data } = await fetchMonoova(P_FINANCIAL_EXECUTE, {
    method: "POST",
    body,
  });
  return data as Monoova.ExecuteResponse;
}

export async function getStatusByUniqueRef(
  uniqueRef: string
): Promise<Monoova.StatusByUidResponse> {
  const { data } = await fetchMonoova(`${P_FINANCIAL_STATUS}/${encodeURIComponent(uniqueRef)}`);
  return data as Monoova.StatusByUidResponse;
}

export async function getStatusByDate(
  startIso: string,
  endIso: string
): Promise<Monoova.StatusByDateResponse> {
  const { data } = await fetchMonoova(
    `${P_FINANCIAL_STATUS}/${encodeURIComponent(startIso)}/${encodeURIComponent(endIso)}`
  );
  return data as Monoova.StatusByDateResponse;
}

export async function getUnclearedByDate(
  startIso: string,
  endIso: string
): Promise<Monoova.UnclearedReportResponse> {
  const { data } = await fetchMonoova(
    `${P_FINANCIAL_UNCLEARED}/${encodeURIComponent(startIso)}/${encodeURIComponent(endIso)}`
  );
  return data as Monoova.UnclearedReportResponse;
}

export async function publicPing() {
  const { data } = await fetchMonoova(P_PUBLIC_PING);
  return data;
}
