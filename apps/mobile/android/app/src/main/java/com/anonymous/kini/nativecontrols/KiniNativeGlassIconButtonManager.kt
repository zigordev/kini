package com.anonymous.kini.nativecontrols

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.widget.FrameLayout
import android.widget.TextView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter

class KiniNativeGlassIconButtonManager : SimpleViewManager<KiniGlassIconButtonView>() {
  override fun getName(): String = "KiniNativeGlassIconButton"

  override fun createViewInstance(
    reactContext: ThemedReactContext,
  ): KiniGlassIconButtonView = KiniGlassIconButtonView(reactContext)

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
    mapOf(
      "topPress" to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to "onPress",
        ),
      ),
    )

  @ReactProp(name = "accessibilityLabelText")
  fun setAccessibilityLabelText(view: KiniGlassIconButtonView, value: String?) {
    view.contentDescription = value
  }

  @ReactProp(name = "disabled", defaultBoolean = false)
  fun setDisabled(view: KiniGlassIconButtonView, disabled: Boolean) {
    view.setDisabled(disabled)
  }

  @ReactProp(name = "iconName")
  fun setIconName(view: KiniGlassIconButtonView, value: String?) {
    view.setIconName(value ?: "plus")
  }
}

class KiniGlassIconButtonView(context: Context) : FrameLayout(context) {
  private var disabled = false
  private val iconView = TextView(context).apply {
    gravity = Gravity.CENTER
    includeFontPadding = false
    setTextColor(Color.rgb(215, 25, 32))
    textSize = 30f
    typeface = Typeface.DEFAULT
  }

  init {
    isClickable = true
    foreground = context.obtainStyledAttributes(
      intArrayOf(android.R.attr.selectableItemBackgroundBorderless),
    ).use { it.getDrawable(0) }
    background = GradientDrawable().apply {
      shape = GradientDrawable.OVAL
      setColor(Color.argb(218, 255, 255, 255))
      setStroke(dp(1), Color.argb(184, 255, 255, 255))
    }
    elevation = dp(6).toFloat()

    addView(iconView, LayoutParams(dp(44), dp(44), Gravity.CENTER))
    setIconName("plus")
    setOnClickListener { view ->
      if (!disabled) {
        val event = Arguments.createMap()
        (view.context as ReactContext)
          .getJSModule(RCTEventEmitter::class.java)
          .receiveEvent(view.id, "topPress", event)
      }
    }
  }

  fun setDisabled(value: Boolean) {
    disabled = value
    isEnabled = !value
    alpha = if (value) 0.45f else 1f
  }

  fun setIconName(value: String) {
    when (value) {
      "sync" -> {
        iconView.text = "↻"
        iconView.textSize = 26f
      }
      else -> {
        iconView.text = "+"
        iconView.textSize = 30f
      }
    }
  }

  private fun dp(value: Int): Int =
    TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      value.toFloat(),
      resources.displayMetrics,
    ).toInt()
}
