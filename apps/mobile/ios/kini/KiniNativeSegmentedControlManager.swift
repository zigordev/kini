import React
import UIKit

@objc(KiniNativeSegmentedControlManager)
final class KiniNativeSegmentedControlManager: RCTViewManager {
  override func view() -> UIView! {
    KiniNativeSegmentedControlView(frame: .zero)
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
