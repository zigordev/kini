#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(KiniNativeToast, NSObject)

RCT_EXTERN_METHOD(show:(NSString *)message type:(NSString *)type)

@end
