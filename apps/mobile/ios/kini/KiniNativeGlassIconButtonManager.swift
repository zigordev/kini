import React
import UIKit

@objc(KiniNativeGlassIconButtonManager)
final class KiniNativeGlassIconButtonManager: RCTViewManager {
  override func view() -> UIView! {
    KiniNativeGlassIconButtonView(frame: .zero)
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
