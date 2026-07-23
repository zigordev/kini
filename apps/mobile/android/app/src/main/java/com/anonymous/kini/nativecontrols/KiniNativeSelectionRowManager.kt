package com.anonymous.kini.nativecontrols

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter

class KiniNativeSelectionRowManager : SimpleViewManager<KiniSelectionRowView>() {
  override fun getName(): String = "KiniNativeSelectionRow"

  override fun createViewInstance(
    reactContext: ThemedReactContext,
  ): KiniSelectionRowView = KiniSelectionRowView(reactContext).apply {
    setOnClickListener { view ->
      val event = Arguments.createMap()
      (view.context as ReactContext)
        .getJSModule(RCTEventEmitter::class.java)
        .receiveEvent(view.id, "topPress", event)
    }
  }

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
    mapOf(
      "topPress" to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to "onPress",
        ),
      ),
    )

  @ReactProp(name = "disabled", defaultBoolean = false)
  fun setDisabled(view: KiniSelectionRowView, disabled: Boolean) {
    view.isEnabled = !disabled
    view.alpha = if (disabled) 0.45f else 1f
  }

  @ReactProp(name = "selected", defaultBoolean = false)
  fun setSelected(view: KiniSelectionRowView, selected: Boolean) {
    view.setSelectedState(selected)
  }

  @ReactProp(name = "title")
  fun setTitle(view: KiniSelectionRowView, title: String?) {
    view.setTitle(title.orEmpty())
  }
}

class KiniSelectionRowView(context: Context) : LinearLayout(context) {
  private val iconView = TextView(context)
  private val titleView = TextView(context)
  private val chevronView = TextView(context)
  private var isRowSelected = false

  init {
    orientation = HORIZONTAL
    gravity = Gravity.CENTER_VERTICAL
    minimumHeight = dp(54)
    setPadding(dp(14), 0, dp(12), 0)
    isClickable = true
    isFocusable = true
    foreground = selectableForeground()

    iconView.gravity = Gravity.CENTER
    iconView.textSize = 18f
    iconView.typeface = Typeface.DEFAULT_BOLD
    addView(
      iconView,
      LayoutParams(dp(34), dp(34)).apply {
        marginEnd = dp(12)
      },
    )

    titleView.textSize = 16f
    titleView.typeface = Typeface.DEFAULT_BOLD
    titleView.setTextColor(Color.rgb(23, 32, 42))
    titleView.maxLines = 1
    addView(
      titleView,
      LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f),
    )

    chevronView.text = ">"
    chevronView.textSize = 18f
    chevronView.typeface = Typeface.DEFAULT_BOLD
    chevronView.setTextColor(Color.rgb(135, 146, 162))
    addView(
      chevronView,
      LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT),
    )

    applySelectedState()
  }

  fun setSelectedState(selected: Boolean) {
    isRowSelected = selected
    applySelectedState()
  }

  fun setTitle(title: String) {
    titleView.text = title
  }

  private fun applySelectedState() {
    val borderColor =
      if (isRowSelected) Color.rgb(215, 25, 32) else Color.rgb(216, 225, 225)
    val backgroundColor =
      if (isRowSelected) Color.rgb(255, 243, 243) else Color.WHITE

    background = GradientDrawable().apply {
      cornerRadius = dp(10).toFloat()
      setColor(backgroundColor)
      setStroke(dp(1), borderColor)
    }

    iconView.text = if (isRowSelected) "✓" else ""
    iconView.setTextColor(Color.WHITE)
    iconView.background = GradientDrawable().apply {
      shape = GradientDrawable.OVAL
      setColor(
        if (isRowSelected) Color.rgb(215, 25, 32) else Color.rgb(252, 231, 232),
      )
    }
  }

  private fun dp(value: Int): Int =
    TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      value.toFloat(),
      resources.displayMetrics,
    ).toInt()

  private fun selectableForeground(): android.graphics.drawable.Drawable? {
    val outValue = TypedValue()
    context.theme.resolveAttribute(android.R.attr.selectableItemBackground, outValue, true)
    return context.getDrawable(outValue.resourceId)
  }
}
