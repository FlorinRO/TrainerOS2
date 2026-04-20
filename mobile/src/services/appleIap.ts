import { Platform } from 'react-native';

export interface Purchase {
  productId: string;
  purchaseToken?: string;
  transactionId?: string;
  transactionDate?: number;
}

export interface ProductOrSubscription {
  displayPrice?: string;
}

const EXPO_GO_IAP_MESSAGE =
  'Native Apple in-app purchases are unavailable in Expo Go. Use a development build or App Store build for IAP testing.';

export async function initAppleIapConnection() {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple in-app purchases are only available on iOS.');
  }

  throw new Error(EXPO_GO_IAP_MESSAGE);
}

export async function loadAppleSubscriptionProduct(
  _productId: string
): Promise<ProductOrSubscription | null> {
  return null;
}

export async function requestAppleMembershipPurchase(
  _productId: string
): Promise<Purchase> {
  throw new Error(EXPO_GO_IAP_MESSAGE);
}

export async function finishApplePurchase(_purchase: Purchase) {}

export async function restoreAppleMembershipPurchases(_productId: string): Promise<Purchase[]> {
  throw new Error(EXPO_GO_IAP_MESSAGE);
}

export async function closeAppleIapConnection() {}
