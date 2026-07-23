package com.anonymous.kini.nativecontrols

import android.widget.Toast
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class KiniNativeToastModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "KiniNativeToast"

  @ReactMethod
  fun show(message: String, type: String?) {
    Toast.makeText(reactContext, message, Toast.LENGTH_LONG).show()
  }
}
