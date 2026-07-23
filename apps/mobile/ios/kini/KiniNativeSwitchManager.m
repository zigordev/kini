#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(KiniNativeSwitchManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(checked, BOOL)
RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)

@end
