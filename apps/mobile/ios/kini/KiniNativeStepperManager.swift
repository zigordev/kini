import React
import UIKit

@objc(KiniNativeStepperManager)
final class KiniNativeStepperManager: RCTViewManager {
  override func view() -> UIView! {
    KiniNativeStepperView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
