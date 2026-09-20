import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FALLBACK_SRM_LOT = {
  id: "69341521c05d1b8f5d85332c",
  name: "SRM University Parking Lot",
  organizationId: "org_srm_university",
  organizationName: "SRM University",
  organizationType: "COLLEGE",
  locationId: "loc_srm_kattankulathur",
  locationName: "Kattankulathur Campus",
  location: "Kattankulathur, Chennai, Tamil Nadu",
  totalSpots: 10,
  availableSpots: 0,
  address: "SRM University, Potheri, Kattankulathur, Chennai, Tamil Nadu 603203",
  latitude: 12.823,
  longitude: 80.045,
  active: true,
  lotType: "PRIVATE",
  paymentModel: "CLIENT_PAID",
  bookingPolicy: {
    bookingMode: "DAILY",
    advanceBookingDays: 1,
    nextDayBookingOpenTime: "18:30",
    dailyBookingEndTime: "18:30",
    fixedTimeSlotsEnabled: true,
    allowOvernightBookings: false,
    refundPolicy: "STANDARD",
    welcomeBonusEnabled: true,
    welcomeBonusAmount: 50.0,
    paymentRequired: false,
    walletPaymentRequired: true,
    bookingRequired: true,
    requiresVehicleRegistration: true,
    requiresUserVerification: true,
    supportsQRCode: true,
    penaltyEnabled: true,
    fixedSlots: [
      {
        id: "FULL_DAY",
        name: "Full Day",
        startTime: "08:00",
        endTime: "17:30",
        description: "Standard day parking (08:00 - 17:30)"
      },
      {
        id: "MORNING",
        name: "Morning",
        startTime: "08:00",
        endTime: "12:30",
        description: "Morning parking window (08:00 - 12:30)"
      },
      {
        id: "AFTERNOON",
        name: "Afternoon",
        startTime: "12:30",
        endTime: "17:30",
        description: "Afternoon parking window (12:30 - 17:30)"
      }
    ],
    maxConcurrentBookingsPerUser: 1,
    noShowGraceMinutes: 90,
    lateCheckoutGracePeriodMinutes: 10.0
  }
};

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(
      "https://gridee.onrender.com/api/parking-lots/search/by-name?name=SRM%20University%20Parking%20Lot",
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "SRM-Nexus/1.0"
        },
        signal: controller.signal,
        cache: "no-store"
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        lot: data,
        isLive: true,
        lastUpdated: new Date().toISOString(),
        storeUrls: {
          android: "https://play.google.com/store/apps/details?id=com.gridee.parking",
          ios: "https://apps.apple.com/in/app/grideeapp/id6757460398",
          web: "https://gridee.in"
        }
      });
    }
  } catch (error) {
    console.warn("[Gridee Proxy] Upstream fetch failed, serving verified fallback:", error);
  }

  // Graceful fallback to verified SRM data if Render is asleep or cold-starting
  return NextResponse.json({
    success: true,
    lot: FALLBACK_SRM_LOT,
    isLive: false,
    lastUpdated: new Date().toISOString(),
    storeUrls: {
      android: "https://play.google.com/store/apps/details?id=com.gridee.parking",
      ios: "https://apps.apple.com/in/app/grideeapp/id6757460398",
      web: "https://gridee.in"
    }
  });
}
