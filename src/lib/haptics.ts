/**
 * Haptic feedback for mobile devices.
 * Uses navigator.vibrate() — gracefully no-ops on unsupported devices.
 */

function vibrate(pattern: number | number[]) {
  try {
    navigator?.vibrate?.(pattern);
  } catch { /* silent */ }
}

/** Light tap — button press */
export function hapticLight() { vibrate(10); }

/** Medium — step advance */
export function hapticMedium() { vibrate(25); }

/** Success — post saved */
export function hapticSuccess() { vibrate([15, 50, 15]); }

/** Celebration — voucher or raffle win */
export function hapticCelebration() { vibrate([15, 30, 15, 30, 30]); }
