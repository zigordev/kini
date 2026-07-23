#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(KiniNativeStepperManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(maximumValue, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(minimumValue, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(step, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(value, NSNumber)

@end
