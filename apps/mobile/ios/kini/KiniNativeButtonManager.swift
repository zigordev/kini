import React
import UIKit

@objc(KiniNativeButtonManager)
final class KiniNativeButtonManager: RCTViewManager {
  override func view() -> UIView! {
    KiniNativeButtonView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
