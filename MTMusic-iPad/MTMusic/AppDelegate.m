//
//  AppDelegate.m
//  MTMusic
//
//  Created by Ben Whittle on 4/11/15.
//  Copyright (c) 2015 Ben Whittle. All rights reserved.
//

#import "AppDelegate.h"
#import <Spotify/Spotify.h>


static NSString * const kClientId = @"002d9d1f653c4421b1433ee50c82d061";
static NSString * const kCallbackURL = @"welcome://mycallback";
static NSString * const kTokenSwapURL = @"http://54.69.227.168:1234/swap";
static NSString * const kTokenRefreshURL = @"http://54.69.227.168:1234/refresh";


@interface AppDelegate ()

@end

@implementation AppDelegate


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {

    [PubNub setDelegate:self];
    PNConfiguration *myConfig = [PNConfiguration configurationForOrigin:@"pubsub.pubnub.com" publishKey:@"pub-c-46a6e70b-932c-464e-899b-1b211eebb103" subscribeKey:@"sub-c-6f80e180-2bba-11e4-bbfa-02ee2ddab7fe" secretKey:nil];
    [PubNub setConfiguration:myConfig];
    [PubNub connect];
    [self subscribeToPNChannels];
    
    self.myApp = application;
    self.vc = (ViewController *)self.window.rootViewController;
    
    self.loggedIn = NO;
    
    [self setupSpotify];
    
    return YES;
}

-(void) setupSpotify {
    
    NSLog(@"heard setupSpotify");
    
    [[SPTAuth defaultInstance] setClientID:kClientId];
    [[SPTAuth defaultInstance] setRedirectURL:[NSURL URLWithString:kCallbackURL]];
    [[SPTAuth defaultInstance] setRequestedScopes:@[SPTAuthStreamingScope, SPTAuthUserReadPrivateScope, SPTAuthPlaylistReadPrivateScope]];
    [[SPTAuth defaultInstance] setTokenSwapURL:[NSURL URLWithString:kTokenSwapURL]];
    [[SPTAuth defaultInstance] setTokenRefreshURL:[NSURL URLWithString:kTokenRefreshURL]];
    self.sptAuth = [SPTAuth defaultInstance];
    
    
    if ([[NSUserDefaults standardUserDefaults] objectForKey:@"userSession"] != nil){
        
        NSData *data = [[NSUserDefaults standardUserDefaults] objectForKey:@"userSession"];
        SPTSession *storedSession = [NSKeyedUnarchiver unarchiveObjectWithData:data];
        
        if (![storedSession isValid]){
            
            NSLog(@"Stored session is not valid anymore...");
            
            dispatch_async(dispatch_get_main_queue(), ^{
                
                [[SPTAuth defaultInstance] renewSession:storedSession
                                               callback:^(NSError *error, SPTSession *session)
                 {
                     if (error != nil) {
                         
                         NSLog(@"Error renewing your session");
                         
                     } else {
                         
                         NSLog(@"Successfully renewed your session!");
                        
                         self.session = storedSession;
                         self.loggedIn = YES;
                         
                         NSData *data = [NSKeyedArchiver archivedDataWithRootObject:session];
                         [[NSUserDefaults standardUserDefaults] setObject:data forKey:@"userSession"];
                     }
                 }];
            });
            
        }
        else {
            
            NSLog(@"Successfully logged in");
            self.session = storedSession;
            self.loggedIn = YES;
            
        }
        
    }
    
}



-(BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation{
    
    if ([[SPTAuth defaultInstance] canHandleURL:url]) {
        
        dispatch_async(dispatch_get_main_queue(), ^{
            
            [self.vc hideBtnAfterLogin];
        });
        
        [[SPTAuth defaultInstance]
         handleAuthCallbackWithTriggeredAuthURL:url
         callback:^(NSError *error, SPTSession *session) {
             
             if (error != nil) {
                 NSLog(@"*** Auth error: %@", error);
                 return;
             }
             
             NSLog(@"Successfully logged in");
             
             self.session = session;
             self.loggedIn = YES;
             
             NSData *data = [NSKeyedArchiver archivedDataWithRootObject:session];
             [[NSUserDefaults standardUserDefaults] setObject:data forKey:@"userSession"];
             
         }];
        return YES;
    }
    else {
        
        NSLog(@"can't handle url");
        
        return NO;
    }
}


-(SPTSession *)getSession {
    
    return self.session;
}


-(SPTAuth *)getAuth {
    
    return self.sptAuth;
}

-(BOOL)checkIfLoggedIn {
    
    return self.loggedIn;
}

-(void)loginWithSpotify {
    
    [self.myApp openURL:[SPTAuth defaultInstance].loginURL];
}


-(void) subscribeToPNChannels {
    
    self.playMusic = [PNChannel channelWithName:@"10206007342850980playMusic" shouldObservePresence:YES];
    self.toggleMusic = [PNChannel channelWithName:@"10206007342850980toggleMusic" shouldObservePresence:YES];
    self.stopMusic = [PNChannel channelWithName:@"10206007342850980stopMusic" shouldObservePresence:YES];

    [PubNub subscribeOn:@[self.playMusic, self.toggleMusic, self.stopMusic]];
    
    
}

- (void)pubnubClient:(PubNub *)client didReceiveMessage:(PNMessage *)message {
    
    NSLog(@"heard Pubnub message!");
    
    if (message.channel == self.playMusic){
        
        NSLog(@"heard playMusic");
        
        [self.vc playUsingSession:self.session trackURI:@"spotify:track:5eWgDlp3k6Tb5RD8690s6I"];
        
    }
    else if (message.channel == self.toggleMusic){
        
        NSLog(@"heard toggleMusic");
        
        [self.vc toggleMusic];
        
    }
    else if (message.channel == self.stopMusic){
        
        NSLog(@"heard stopMusic");
        
        [self.vc stopMusic];
        
    }

}




@end
