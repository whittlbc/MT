//
//  AppDelegate.h
//  MTMusic
//
//  Created by Ben Whittle on 4/11/15.
//  Copyright (c) 2015 Ben Whittle. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <Spotify/Spotify.h>
#import "ViewController.h"

@interface AppDelegate : UIResponder <UIApplicationDelegate, PNDelegate>

@property (strong, nonatomic) UIWindow *window;
@property (strong, nonatomic) SPTAuth *sptAuth;
@property (strong, nonatomic) SPTSession *session;
@property (nonatomic) BOOL loggedIn;
@property (strong, nonatomic) UIApplication *myApp;
@property (strong, nonatomic) ViewController *vc;
@property (nonatomic, strong) PNChannel *playMusic;
@property (nonatomic, strong) PNChannel *toggleMusic;
@property (nonatomic, strong) PNChannel *stopMusic;

-(void) setupSpotify;
-(SPTSession *)getSession;
-(SPTAuth *)getAuth;
-(BOOL)checkIfLoggedIn;
-(void)loginWithSpotify;
-(void) subscribeToPNChannels;

@end


