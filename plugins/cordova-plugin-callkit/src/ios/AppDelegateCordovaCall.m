#import "AppDelegate.h"
#import "Intents/Intents.h"
#import <CallKit/CallKit.h>
#import <objc/runtime.h>
#import "CordovaCall.h"


@implementation AppDelegate (CordovaCall)

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray *restorableObjects))restorationHandler
{
    INInteraction *interaction = userActivity.interaction;
    INIntent *intent = interaction.intent;
    BOOL isVideo = [intent isKindOfClass:[INStartVideoCallIntent class]];
    INPerson *contact;
    if(isVideo) {
        INStartVideoCallIntent *startCallIntent = (INStartVideoCallIntent *)intent;
        contact = startCallIntent.contacts.firstObject;
    } else {
        INStartAudioCallIntent *startCallIntent = (INStartAudioCallIntent *)intent;
        contact = startCallIntent.contacts.firstObject;
    }
    INPersonHandle *personHandle = contact.personHandle;
    NSString *callId = personHandle.value;
    NSString *callName = [[NSUserDefaults standardUserDefaults] stringForKey:callId];
    if(!callName) {
        callName = callId;
    }
    NSDictionary *intentInfo = @{ @"callName" : callName, @"callId" : callId, @"isVideo" : isVideo?@YES:@NO};
    [[NSNotificationCenter defaultCenter] postNotificationName:@"RecentsCallNotification" object:intentInfo];
    return YES;
}

// - (void)applicationWillResignActive:(UIApplication *)application {
//     NSLog(@"app will resign active");
// }

- (void)applicationDidEnterBackground:(UIApplication *)application {
    NSLog(@"app enter background");
    [CordovaCall.cordovaCallPlugin appEnterBackground];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    NSLog(@"app become active");
    [CordovaCall.cordovaCallPlugin appEnterForeground];
}
@end