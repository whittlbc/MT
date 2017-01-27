//
//  ViewController.h
//  MTMusic
//
//  Created by Ben Whittle on 4/11/15.
//  Copyright (c) 2015 Ben Whittle. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <Spotify/Spotify.h>

@interface ViewController : UIViewController <SPTAudioStreamingDelegate, SPTAudioStreamingPlaybackDelegate>

-(void)playUsingSession:(SPTSession *)session trackURI:(id)trackURI;
-(void) hideBtnAfterLogin;
-(void)toggleMusic;
-(void)stopMusic;

@end

