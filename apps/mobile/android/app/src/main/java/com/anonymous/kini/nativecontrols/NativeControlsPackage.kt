package com.anonymous.kini.nativecontrols

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class NativeControlsPackage : ReactPackage {
  override fun createNativeModules(
    reactContext: ReactApplicationContext,
  ): List<NativeModule> = listOf(
    KiniNativeToastModule(reactContext),
  )

  override fun createViewManagers(
    reactContext: ReactApplicationContext,
  ): List<ViewManager<*, *>> = listOf(
    KiniNativeBottomNavManager(),
    KiniNativeButtonManager(),
    KiniNativeDatePickerManager(),
    KiniNativeGlassIconButtonManager(),
    KiniNativeOptionStackManager(),
    KiniNativePoolConfigButtonManager(),
    KiniNativeSelectManager(),
    KiniNativeSelectionRowManager(),
    KiniNativeSegmentedControlManager(),
    KiniNativeStepperManager(),
    KiniNativeSwitchManager(),
  )
}
