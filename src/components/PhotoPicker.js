import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

const MAX_PHOTOS = 5;
const MIN_PHOTOS = 3;

export const PhotoPicker = ({navigation}) => {
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const checkPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      // Check Android version to determine which permission to request
      const apiLevel = Platform.Version;

      // First check if permission is already granted
      let hasPermission = false;

      if (apiLevel >= 33) {
        // Android 13+ (API 33+)
        hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);

      } else {
        // Android 12L (API 32) and below
        hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      }

      if (hasPermission) {
        return true;
      }

      // Request appropriate permission based on API level
      let permissionToRequest;
      if (apiLevel >= 33) {
        permissionToRequest = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
      } else {
        permissionToRequest = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      }

      const granted = await PermissionsAndroid.request(permissionToRequest, {
        title: 'Photo Library Permission',
        message: 'ILoveVideo needs access to your photo library to select images.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS handles permissions via Info.plist
  }, []);

  const openImagePicker = useCallback(async () => {
    if (selectedPhotos.length >= MAX_PHOTOS) {
      Alert.alert(
        'Maximum Photos Reached',
        `You can only select up to ${MAX_PHOTOS} photos.`
      );
      return;
    }

    const hasPermission = await checkPermission();
    console.log(hasPermission,'permissosin')
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Please grant photo library access to select photos.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: MAX_PHOTOS - selectedPhotos.length,
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        presentationStyle: 'fullScreen',
      });
   
      if (result.didCancel) {
        console.log('User cancelled image picker');
      } else if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to select photos');
      } else if (result.assets) {
        const newPhotos = result.assets.map((asset) => ({
          uri: asset.uri || '',
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          type: asset.type,
          width: asset.width,
          height: asset.height,
        }));
        setSelectedPhotos((prev) => [...prev, ...newPhotos])
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPhotos.length, checkPermission]);

  const removePhoto = useCallback((index) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllPhotos = useCallback(() => {
    Alert.alert(
      'Clear All Photos',
      'Are you sure you want to remove all selected photos?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setSelectedPhotos([]) },
      ]
    );
  }, []);

  const canProceed = selectedPhotos.length >= MIN_PHOTOS;
  const remainingSlots = MAX_PHOTOS - selectedPhotos.length;

  const handleProceed = () => {
      if (canProceed) {
        // Alert.alert(
        //   'Photos Selected',
        //   `You have selected ${selectedPhotos.length} photos. Ready to proceed!`,
        //   [{ text: 'OK' }]
        // );
        navigation.navigate('Slideshowplayer',{photos:selectedPhotos})
        console.log('Selected photos:', selectedPhotos);
        
      } else {
        Alert.alert(
          'Minimum Photos Required',
          `Please select at least ${MIN_PHOTOS} photos to continue.`
        );
      }
    
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Photos</Text>
        <Text style={styles.subtitle}>
          Choose {MIN_PHOTOS}-{MAX_PHOTOS} photos from your gallery
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(selectedPhotos.length / MAX_PHOTOS) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {selectedPhotos.length} / {MAX_PHOTOS} photos selected
        </Text>
      </View>

      {selectedPhotos.length === 0 ? (
        <TouchableOpacity style={styles.addButton} onPress={openImagePicker} disabled={isLoading}>
          <Text style={styles.addButtonText}>+ Add Photos</Text>
          <Text style={styles.addButtonHint}>Tap to select {MIN_PHOTOS}-{MAX_PHOTOS} photos</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.gridContainer}>
            {selectedPhotos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.photo}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(index)}
                  accessibilityLabel={`Remove photo ${index + 1}`}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {selectedPhotos.length < MAX_PHOTOS && (
              <TouchableOpacity style={[styles.photoWrapper, styles.addSlot]} onPress={openImagePicker} disabled={isLoading}>
                <Text style={styles.addSlotText}>+</Text>
                <Text style={styles.addSlotHint}>Add more</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={clearAllPhotos}
              disabled={selectedPhotos.length === 0}
            >
              <Text style={styles.actionButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.confirmButton,
                !canProceed && styles.confirmButtonDisabled,
              ]}
              onPress={handleProceed}
              disabled={!canProceed || isLoading}
            >
              <Text style={styles.actionButtonPrim}>
                {isLoading ? 'Processing...' : 'Confirm Selection'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {selectedPhotos.length < MIN_PHOTOS
            ? `Select ${MIN_PHOTOS - selectedPhotos.length} more photo${
                MIN_PHOTOS - selectedPhotos.length > 1 ? 's' : ''
              } to continue`
            : `You can add up to ${remainingSlots} more photo${
                remainingSlots > 1 ? 's' : ''
              }`}
        </Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  progressContainer: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#f0f7ff',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  addButtonHint: {
    fontSize: 14,
    color: '#666',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  photoWrapper: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  addSlot: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSlotText: {
    fontSize: 36,
    fontWeight: '300',
    color: '#007AFF',
    marginBottom: 4,
  },
  addSlotHint: {
    fontSize: 12,
    color: '#007AFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
   actionButtonPrim: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  infoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PhotoPicker;