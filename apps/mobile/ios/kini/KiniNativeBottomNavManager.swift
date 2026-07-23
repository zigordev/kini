import React
import UIKit

@objc(KiniNativeBottomNavManager)
final class KiniNativeBottomNavManager: RCTViewManager {
  override func view() -> UIView! {
    KiniNativeBottomNavView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
