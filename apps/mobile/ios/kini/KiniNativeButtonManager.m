#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(KiniNativeButtonManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(title, NSString)
RCT_EXPORT_VIEW_PROPERTY(variant, NSString)

@end
