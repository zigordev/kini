import React
import UIKit

@objc(KiniNativeSelectManager)
final class KiniNativeSelectManager: RCTViewManager {
  override func view() -> UIView! {
    KiniNativeSelectView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
