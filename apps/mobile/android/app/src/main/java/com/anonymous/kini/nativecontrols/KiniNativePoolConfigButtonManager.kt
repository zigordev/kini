package com.anonymous.kini.nativecontrols

import android.app.AlertDialog
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.NumberPicker
import android.widget.Switch
import android.widget.TextView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter

class KiniNativePoolConfigButtonManager : SimpleViewManager<KiniPoolConfigButtonView>() {
  override fun getName(): String = "KiniNativePoolConfigButton"

  override fun createViewInstance(
    reactContext: ThemedReactContext,
  ): KiniPoolConfigButtonView = KiniPoolConfigButtonView(reactContext)

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
    mapOf(
      "topChange" to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to "onChange",
        ),
      ),
    )

  @ReactProp(name = "disabled", defaultBoolean = false)
  fun setDisabled(view: KiniPoolConfigButtonView, disabled: Boolean) {
    view.setDisabled(disabled)
  }

  @ReactProp(name = "doneTitle")
  fun setDoneTitle(view: KiniPoolConfigButtonView, value: String?) {
    view.doneTitle = value.orEmpty().ifBlank { "OK" }
  }

  @ReactProp(name = "doubles", defaultInt = 0)
  fun setDoubles(view: KiniPoolConfigButtonView, value: Int) {
    view.doubles = value
  }

  @ReactProp(name = "doublesTitle")
  fun setDoublesTitle(view: KiniPoolConfigButtonView, value: String?) {
    view.doublesTitle = value.orEmpty().ifBlank { "Dobles" }
  }

  @ReactProp(name = "elige8", defaultBoolean = false)
  fun setElige8(view: KiniPoolConfigButtonView, value: Boolean) {
    view.elige8 = value
  }

  @ReactProp(name = "e8Title")
  fun setE8Title(view: KiniPoolConfigButtonView, value: String?) {
    view.e8Title = value.orEmpty().ifBlank { "E8" }
  }

  @ReactProp(name = "maxDoubles", defaultInt = 14)
  fun setMaxDoubles(view: KiniPoolConfigButtonView, value: Int) {
    view.maxDoubles = value
  }

  @ReactProp(name = "maxTriples", defaultInt = 9)
  fun setMaxTriples(view: KiniPoolConfigButtonView, value: Int) {
    view.maxTriples = value
  }

  @ReactProp(name = "minDoubles", defaultInt = 0)
  fun setMinDoubles(view: KiniPoolConfigButtonView, value: Int) {
    view.minDoubles = value
  }

  @ReactProp(name = "minTriples", defaultInt = 0)
  fun setMinTriples(view: KiniPoolConfigButtonView, value: Int) {
    view.minTriples = value
  }

  @ReactProp(name = "title")
  fun setTitle(view: KiniPoolConfigButtonView, value: String?) {
    view.title = value.orEmpty().ifBlank { "Configuración" }
  }

  @ReactProp(name = "triples", defaultInt = 0)
  fun setTriples(view: KiniPoolConfigButtonView, value: Int) {
    view.triples = value
  }

  @ReactProp(name = "triplesTitle")
  fun setTriplesTitle(view: KiniPoolConfigButtonView, value: String?) {
    view.triplesTitle = value.orEmpty().ifBlank { "Triples" }
  }
}

class KiniPoolConfigButtonView(context: Context) : FrameLayout(context) {
  var doneTitle: String = "OK"
  var doubles: Int = 0
  var doublesTitle: String = "Dobles"
  var elige8: Boolean = false
  var e8Title: String = "E8"
  var maxDoubles: Int = 14
  var maxTriples: Int = 9
  var minDoubles: Int = 0
  var minTriples: Int = 0
  var title: String = "Configuración"
  var triples: Int = 0
  var triplesTitle: String = "Triples"

  private var disabled: Boolean = false

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

    val icon = ImageView(context).apply {
      setImageResource(android.R.drawable.ic_menu_manage)
      setColorFilter(Color.rgb(215, 25, 32))
      scaleType = ImageView.ScaleType.CENTER
    }
    addView(
      icon,
      LayoutParams(dp(24), dp(24), Gravity.CENTER),
    )
    setOnClickListener {
      if (!disabled) {
        showDialog()
      }
    }
  }

  fun setDisabled(value: Boolean) {
    disabled = value
    isEnabled = !value
    alpha = if (value) 0.45f else 1f
  }

  private fun showDialog() {
    var nextDoubles = doubles.coerceIn(minDoubles, maxDoubles)
    var nextTriples = triples.coerceIn(minTriples, maxTriples)
    var nextElige8 = elige8

    val content = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(20), dp(8), dp(20), dp(8))
    }

    content.addView(
      numberRow(doublesTitle, nextDoubles, minDoubles, maxDoubles) { value ->
        nextDoubles = value
        doubles = value
        emitChange(nextDoubles, nextTriples, nextElige8)
      },
    )
    content.addView(
      numberRow(triplesTitle, nextTriples, minTriples, maxTriples) { value ->
        nextTriples = value
        triples = value
        emitChange(nextDoubles, nextTriples, nextElige8)
      },
    )
    content.addView(
      switchRow(e8Title, nextElige8) { value ->
        nextElige8 = value
        elige8 = value
        emitChange(nextDoubles, nextTriples, nextElige8)
      },
    )

    AlertDialog.Builder(context)
      .setTitle(title)
      .setView(content)
      .setPositiveButton(doneTitle, null)
      .show()
  }

  private fun numberRow(
    label: String,
    value: Int,
    minValue: Int,
    maxValue: Int,
    onChange: (Int) -> Unit,
  ): View {
    val row = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      setPadding(0, dp(8), 0, dp(8))
    }

    val labelView = TextView(context).apply {
      text = label
      textSize = 17f
      typeface = Typeface.DEFAULT_BOLD
      setTextColor(Color.rgb(23, 32, 42))
    }
    row.addView(labelView, LinearLayout.LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))

    val picker = NumberPicker(context).apply {
      this.minValue = minValue
      this.maxValue = maxValue
      this.value = value.coerceIn(minValue, maxValue)
      wrapSelectorWheel = false
      descendantFocusability = NumberPicker.FOCUS_BLOCK_DESCENDANTS
      setOnValueChangedListener { _, _, newValue ->
        onChange(newValue)
      }
    }
    row.addView(picker, LinearLayout.LayoutParams(dp(96), dp(112)))
    return row
  }

  private fun switchRow(
    label: String,
    value: Boolean,
    onChange: (Boolean) -> Unit,
  ): View {
    val row = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      setPadding(0, dp(8), 0, dp(8))
    }

    val labelView = TextView(context).apply {
      text = label
      textSize = 17f
      typeface = Typeface.DEFAULT_BOLD
      setTextColor(Color.rgb(23, 32, 42))
    }
    row.addView(labelView, LinearLayout.LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))

    val control = Switch(context).apply {
      isChecked = value
      setOnCheckedChangeListener { _, isChecked ->
        onChange(isChecked)
      }
    }
    row.addView(control)
    return row
  }

  private fun emitChange(nextDoubles: Int, nextTriples: Int, nextElige8: Boolean) {
    val event = Arguments.createMap().apply {
      putInt("doubles", nextDoubles)
      putInt("triples", nextTriples)
      putBoolean("elige8", nextElige8)
    }
    (context as ReactContext)
      .getJSModule(RCTEventEmitter::class.java)
      .receiveEvent(id, "topChange", event)
  }

  private fun dp(value: Int): Int =
    (value * resources.displayMetrics.density).toInt()
}

private inline fun <T> android.content.res.TypedArray.use(block: (android.content.res.TypedArray) -> T): T {
  try {
    return block(this)
  } finally {
    recycle()
  }
}
