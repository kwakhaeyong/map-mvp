import { MapSession } from "../types";

export type AuthProviderId = "local" | "google" | "apple" | "kakao" | "naver";
export type PaymentProviderId = "demo" | "applePay" | "googlePay" | "naverPay" | "kakaoPay" | "tossPay";

export type AuthProvider = {
  id: AuthProviderId;
  configured: boolean;
  label: string;
  saveCurrentDevice: (session: MapSession) => Promise<{ ok: true; message: string }>;
};

export type PaymentProvider = {
  id: PaymentProviderId;
  configured: boolean;
  label: string;
  requestUpgrade: (feature: string) => Promise<{ ok: false; message: string }>;
};

async function localSave() {
  return { ok: true as const, message: "이 MAP은 현재 브라우저에 임시 저장되어 있어요." };
}

async function unavailable(feature: string) {
  return { ok: false as const, message: `${feature}은 결제 연동 후 사용할 수 있어요. 지금은 기본 MAP과 인쇄/PDF 저장을 무료로 사용할 수 있습니다.` };
}

export const localAuthProvider: AuthProvider = { id: "local", configured: true, label: "지금은 이 기기에만 저장", saveCurrentDevice: localSave };

export const plannedSocialAuthProviders: AuthProvider[] = [
  { id: "google", configured: false, label: "Google로 저장", saveCurrentDevice: localSave },
  { id: "apple", configured: false, label: "Apple로 저장", saveCurrentDevice: localSave },
  { id: "kakao", configured: false, label: "카카오로 저장", saveCurrentDevice: localSave },
  { id: "naver", configured: false, label: "네이버로 저장", saveCurrentDevice: localSave },
];

export const demoPaymentProvider: PaymentProvider = { id: "demo", configured: false, label: "프리미엄 내보내기 준비 중", requestUpgrade: unavailable };

export const plannedPaymentProviders: PaymentProvider[] = [
  { id: "applePay", configured: false, label: "Apple Pay", requestUpgrade: unavailable },
  { id: "googlePay", configured: false, label: "Google Pay", requestUpgrade: unavailable },
  { id: "naverPay", configured: false, label: "Naver Pay", requestUpgrade: unavailable },
  { id: "kakaoPay", configured: false, label: "Kakao Pay", requestUpgrade: unavailable },
  { id: "tossPay", configured: false, label: "Toss Pay", requestUpgrade: unavailable },
];
