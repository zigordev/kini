import React
import UIKit

@objc(KiniNativeOptionStackManager)
final class KiniNativeOptionStackManager: RCTViewManager {
  override func view() -> UIView! {
    KiniNativeOptionStackView(frame: .zero)
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
