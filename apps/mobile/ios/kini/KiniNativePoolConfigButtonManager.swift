import React
import UIKit

@objc(KiniNativePoolConfigButtonManager)
final class KiniNativePoolConfigButtonManager: RCTViewManager {
  override func view() -> UIView! {
    KiniNativePoolConfigButtonView(frame: .zero)
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
