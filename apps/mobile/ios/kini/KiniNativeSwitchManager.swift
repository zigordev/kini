import React
import UIKit

@objc(KiniNativeSwitchManager)
final class KiniNativeSwitchManager: RCTViewManager {
  override func view() -> UIView! {
    KiniNativeSwitchView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
