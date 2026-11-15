import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Audio } from 'react-native-audio-api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TRANSITION_DURATION = 800;
const PHOTO_DISPLAY_DURATION = 3000;

export const Slideshowplayer = ({ route, navigation }) => {
  const { photos } = route.params || {};

  const [visiblePhotoIndex, setVisiblePhotoIndex] = useState(0);
  const [nextPhotoIndex, setNextPhotoIndex] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [soundError, setSoundError] = useState(null);

  const progress = useSharedValue(0);
  const isTransitioning = useSharedValue(false);

  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Setup background music - AUTO PLAY by default
//   useEffect(() => {
//     // Create Audio element (similar to HTML5 Audio)
//     const backgroundMusic = new Audio();
//     backgroundMusic.loop = true; // Infinite loop
//     backgroundMusic.volume = 0.5; // 50% volume

//     // Load from assets - use file:// URI for Android
//     backgroundMusic.src = 'file:///android/app/src/main/assets/musicbeach.mp3/musicbeach.mp3';

//     backgroundMusic.oncanplay = () => {
//       console.log('Music loaded, starting playback');
//       backgroundMusic.play().then(() => {
//         setIsPlaying(true);
//         console.log('Background music started playing');
//       }).catch((error) => {
//         console.log('Auto-play failed:', error);
//       });
//     };

//     backgroundMusic.onerror = (error) => {
//       console.log('Failed to load sound:', error);
//       setSoundError('Music file not found. Add background-music.mp3 to android/app/src/main/assets/');
//     };

//     backgroundMusic.load();
//     setAudio(backgroundMusic);

//     return () => {
//       if (backgroundMusic) {
//         backgroundMusic.pause();
//         backgroundMusic.src = '';
//       }
//     };
//   }, []);

  // Toggle play/pause
  const togglePlayback = () => {
    if (!audio) {
      Alert.alert('Music', soundError || 'Music file not loaded. Please add background-music.mp3 to assets.');
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((error) => {
        console.log('Playback failed:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const advanceSlide = () => {
    if (!mountedRef.current || isTransitioning.value || !photos || photos.length <= 1) return;
    isTransitioning.value = true;

    progress.value = withTiming(1, {
      duration: TRANSITION_DURATION,
      easing: Easing.out(Easing.cubic)
    }, (finished) => {
      if (finished && mountedRef.current) {
        runOnJS(onTransitionComplete)();
      }
    });
  };

  const onTransitionComplete = () => {
    if (!mountedRef.current) return;

    setVisiblePhotoIndex(prev => (prev + 1) % photos.length);
    setNextPhotoIndex(prev => (prev + 1) % photos.length);

    progress.value = 0;
    isTransitioning.value = false;
  };

  useEffect(() => {
    mountedRef.current = true;
    if (photos && photos.length > 0) {
      intervalRef.current = setInterval(() => {
        runOnJS(advanceSlide)();
      }, PHOTO_DISPLAY_DURATION + TRANSITION_DURATION);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [photos?.length]);

  const layer0Style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 1], [1, 0]),
      transform: [{ translateX: interpolate(p, [0, 1], [0, -SCREEN_WIDTH]) }],
    };
  });

  const layer1Style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 1], [0, 1]),
      transform: [{ translateX: interpolate(p, [0, 1], [SCREEN_WIDTH, 0]) }],
    };
  });

  if (!photos || photos.length === 0) {
    return <View style={styles.container} />;
  }

  const currentPhoto = photos[visiblePhotoIndex];
  const nextPhoto = photos[nextPhotoIndex];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

    <View style={styles.viewcontainer} pointerEvents="none">
      <Animated.Image
        source={{ uri: nextPhoto.uri }}
        style={[
          styles.photo,
          layer1Style,
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
        ]}
        resizeMode="cover"
      />

      <Animated.Image
        source={{ uri: currentPhoto.uri }}
        style={[
          styles.photo,
          layer0Style,
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
        ]}
        resizeMode="cover"
      />
      
    </View>
    
    <View style={styles.controlsContainer}>
      <TouchableOpacity style={[styles.actionButton, !audio && styles.disabledButton]} onPress={togglePlayback}>
        <Text style={styles.buttonText}>
          {soundError ? 'No Music File' : (isPlaying ? 'Pause Music' : 'Play Music')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionButton, styles.exportButton]} onPress={() => Alert.alert('Export', 'Export feature coming soon!')}>
        <Text style={styles.buttonText}>Export Video</Text>
      </TouchableOpacity>
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  viewcontainer: {
    // width: '100%',
    // aspectRatio: 16/9,
    height:'70%',
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  photo: {
    width: SCREEN_WIDTH,
    
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 4,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
  },
  exportButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  exportProgressContainer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  exportProgressText: {
    fontSize: 14,
    color: '#666',
  },
});

export default Slideshowplayer;
