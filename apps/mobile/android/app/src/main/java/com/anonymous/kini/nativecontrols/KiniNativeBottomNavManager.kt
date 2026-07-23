package com.anonymous.kini.nativecontrols

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.Drawable
import android.util.TypedValue
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import kotlin.math.min

class KiniNativeBottomNavManager : SimpleViewManager<KiniBottomNavView>() {
  override fun getName(): String = "KiniNativeBottomNav"

  override fun createViewInstance(reactContext: ThemedReactContext): KiniBottomNavView =
    KiniBottomNavView(reactContext)

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
    mapOf(
      "topSelect" to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to "onSelect",
        ),
      ),
    )

  @ReactProp(name = "availablePoolsTitle")
  fun setAvailablePoolsTitle(view: KiniBottomNavView, title: String?) {
    view.setTitle("available-pools", title.orEmpty())
  }

  @ReactProp(name = "poolsTitle")
  fun setPoolsTitle(view: KiniBottomNavView, title: String?) {
    view.setTitle("pools", title.orEmpty())
  }

  @ReactProp(name = "profileTitle")
  fun setProfileTitle(view: KiniBottomNavView, title: String?) {
    view.setTitle("profile", title.orEmpty())
  }

  @ReactProp(name = "selectedTab")
  fun setSelectedTab(view: KiniBottomNavView, selectedTab: String?) {
    view.setSelectedTab(selectedTab ?: "pools")
  }

  @ReactProp(name = "statsTitle")
  fun setStatsTitle(view: KiniBottomNavView, title: String?) {
    view.setTitle("stats", title.orEmpty())
  }
}

class KiniBottomNavView(context: Context) : LinearLayout(context) {
  private val tabs = listOf(
    TabSpec("available-pools", "calendar"),
    TabSpec("pools", "pool"),
    TabSpec("stats", "stats"),
    TabSpec("profile", "profile"),
  )
  private val tabViews = mutableMapOf<String, TextView>()
  private var selectedTab = "pools"

  init {
    orientation = HORIZONTAL
    gravity = Gravity.CENTER
    minimumHeight = dp(68)
    setBackgroundColor(Color.WHITE)
    elevation = dp(6).toFloat()

    tabs.forEach { tab ->
      val item = TextView(context).apply {
        gravity = Gravity.CENTER
        textSize = 11f
        maxLines = 1
        includeFontPadding = false
        setPadding(dp(4), dp(7), dp(4), dp(5))
        setCompoundDrawablePadding(dp(4))
        foreground = selectableForeground()
        setOnClickListener {
          selectedTab = tab.key
          updateSelection()
          val event = Arguments.createMap().apply {
            putString("tab", tab.key)
          }
          (context as ReactContext)
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(this@KiniBottomNavView.id, "topSelect", event)
        }
      }

      tabViews[tab.key] = item
      addView(item, LayoutParams(0, LayoutParams.MATCH_PARENT, 1f))
    }

    updateSelection()
  }

  fun setSelectedTab(tab: String) {
    selectedTab = tab
    updateSelection()
  }

  fun setTitle(tab: String, title: String) {
    tabViews[tab]?.text = title
  }

  private fun updateSelection() {
    tabs.forEach { tab ->
      val view = tabViews[tab.key] ?: return@forEach
      val selected = tab.key == selectedTab
      val color =
        if (selected) Color.rgb(215, 25, 32) else Color.rgb(135, 146, 162)
      view.setTextColor(color)
      view.typeface = if (selected) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
      view.setCompoundDrawablesWithIntrinsicBounds(
        null,
        NavIconDrawable(tab.icon, color, dp(23)),
        null,
        null,
      )
    }
  }

  private fun selectableForeground(): android.graphics.drawable.Drawable? {
    val outValue = TypedValue()
    context.theme.resolveAttribute(android.R.attr.selectableItemBackground, outValue, true)
    return context.getDrawable(outValue.resourceId)
  }

  private fun dp(value: Int): Int =
    TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      value.toFloat(),
      resources.displayMetrics,
    ).toInt()

  private data class TabSpec(
    val key: String,
    val icon: String,
  )
}

private class NavIconDrawable(
  private val type: String,
  private val iconColor: Int,
  private val iconSize: Int,
) : Drawable() {
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = iconColor
    strokeCap = Paint.Cap.ROUND
    strokeJoin = Paint.Join.ROUND
    style = Paint.Style.STROKE
  }

  override fun draw(canvas: Canvas) {
    val bounds = bounds
    val width = bounds.width().toFloat()
    val height = bounds.height().toFloat()
    val size = min(width, height)
    val left = bounds.left + (width - size) / 2f
    val top = bounds.top + (height - size) / 2f
    paint.strokeWidth = size * 0.085f

    canvas.save()
    canvas.translate(left, top)

    when (type) {
      "calendar" -> drawCalendar(canvas, size)
      "stats" -> drawStats(canvas, size)
      "profile" -> drawProfile(canvas, size)
      else -> drawDocument(canvas, size)
    }

    canvas.restore()
  }

  override fun getIntrinsicHeight(): Int = iconSize

  override fun getIntrinsicWidth(): Int = iconSize

  @Deprecated("Deprecated in Java")
  override fun getOpacity(): Int = PixelFormat.TRANSLUCENT

  override fun setAlpha(alpha: Int) {
    paint.alpha = alpha
  }

  override fun setColorFilter(colorFilter: ColorFilter?) {
    paint.colorFilter = colorFilter
  }

  private fun drawCalendar(canvas: Canvas, size: Float) {
    val rect = RectF(size * 0.18f, size * 0.22f, size * 0.82f, size * 0.82f)
    canvas.drawRoundRect(rect, size * 0.08f, size * 0.08f, paint)
    canvas.drawLine(size * 0.18f, size * 0.38f, size * 0.82f, size * 0.38f, paint)
    canvas.drawLine(size * 0.34f, size * 0.15f, size * 0.34f, size * 0.28f, paint)
    canvas.drawLine(size * 0.66f, size * 0.15f, size * 0.66f, size * 0.28f, paint)
  }

  private fun drawDocument(canvas: Canvas, size: Float) {
    val path = Path().apply {
      moveTo(size * 0.26f, size * 0.15f)
      lineTo(size * 0.61f, size * 0.15f)
      lineTo(size * 0.78f, size * 0.32f)
      lineTo(size * 0.78f, size * 0.85f)
      lineTo(size * 0.26f, size * 0.85f)
      close()
    }
    canvas.drawPath(path, paint)
    canvas.drawLine(size * 0.61f, size * 0.15f, size * 0.61f, size * 0.33f, paint)
    canvas.drawLine(size * 0.61f, size * 0.33f, size * 0.78f, size * 0.33f, paint)
    canvas.drawLine(size * 0.38f, size * 0.50f, size * 0.66f, size * 0.50f, paint)
    canvas.drawLine(size * 0.38f, size * 0.64f, size * 0.66f, size * 0.64f, paint)
  }

  private fun drawStats(canvas: Canvas, size: Float) {
    canvas.drawLine(size * 0.25f, size * 0.82f, size * 0.25f, size * 0.55f, paint)
    canvas.drawLine(size * 0.50f, size * 0.82f, size * 0.50f, size * 0.32f, paint)
    canvas.drawLine(size * 0.75f, size * 0.82f, size * 0.75f, size * 0.44f, paint)
    canvas.drawLine(size * 0.16f, size * 0.82f, size * 0.84f, size * 0.82f, paint)
  }

  private fun drawProfile(canvas: Canvas, size: Float) {
    canvas.drawCircle(size * 0.50f, size * 0.34f, size * 0.15f, paint)
    val rect = RectF(size * 0.26f, size * 0.56f, size * 0.74f, size * 0.86f)
    canvas.drawArc(rect, 200f, 140f, false, paint)
  }
}
