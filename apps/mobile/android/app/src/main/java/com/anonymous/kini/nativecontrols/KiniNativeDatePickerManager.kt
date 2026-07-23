package com.anonymous.kini.nativecontrols

import android.app.DatePickerDialog
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.widget.Button
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import java.util.Calendar

class KiniNativeDatePickerManager : SimpleViewManager<KiniDatePickerButton>() {
  override fun getName(): String = "KiniNativeDatePicker"

  override fun createViewInstance(
    reactContext: ThemedReactContext,
  ): KiniDatePickerButton = KiniDatePickerButton(reactContext)

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
    mapOf(
      "topChange" to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to "onChange",
        ),
      ),
    )

  @ReactProp(name = "disabled", defaultBoolean = false)
  fun setDisabled(view: KiniDatePickerButton, disabled: Boolean) {
    view.isEnabled = !disabled
    view.alpha = if (disabled) 0.55f else 1f
  }

  @ReactProp(name = "label")
  fun setLabel(view: KiniDatePickerButton, label: String?) {
    view.text = label.orEmpty()
  }

  @ReactProp(name = "value", defaultDouble = 0.0)
  fun setValue(view: KiniDatePickerButton, value: Double) {
    view.dateMillis = value.toLong()
  }
}

class KiniDatePickerButton(context: Context) : Button(context) {
  var dateMillis: Long = 0L

  init {
    isAllCaps = false
    typeface = Typeface.DEFAULT_BOLD
    setTextColor(Color.rgb(23, 32, 42))
    setPadding(28, 0, 28, 0)
    background = GradientDrawable().apply {
      cornerRadius = 18f
      setColor(Color.WHITE)
      setStroke(2, Color.rgb(216, 225, 225))
    }
    setOnClickListener { openDialog() }
  }

  private fun openDialog() {
    val calendar = Calendar.getInstance().apply {
      timeInMillis = if (dateMillis > 0L) dateMillis else System.currentTimeMillis()
    }

    DatePickerDialog(
      context,
      { _, year, month, dayOfMonth ->
        val selected = Calendar.getInstance().apply {
          set(Calendar.YEAR, year)
          set(Calendar.MONTH, month)
          set(Calendar.DAY_OF_MONTH, dayOfMonth)
          set(Calendar.HOUR_OF_DAY, 0)
          set(Calendar.MINUTE, 0)
          set(Calendar.SECOND, 0)
          set(Calendar.MILLISECOND, 0)
        }
        dateMillis = selected.timeInMillis
        val event = Arguments.createMap().apply {
          putDouble("value", dateMillis.toDouble())
        }
        (context as ReactContext)
          .getJSModule(RCTEventEmitter::class.java)
          .receiveEvent(id, "topChange", event)
      },
      calendar.get(Calendar.YEAR),
      calendar.get(Calendar.MONTH),
      calendar.get(Calendar.DAY_OF_MONTH),
    ).show()
  }
}
