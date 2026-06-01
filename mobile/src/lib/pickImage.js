import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/** Pick one photo from gallery; returns local `uri` or null if cancelled. */
export async function pickImageFromGallery() {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to add images.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0].uri;
  } catch (err) {
    Alert.alert('Error', err?.message ?? 'Could not open photo library.');
    return null;
  }
}

export function appendImageFile(formData, uri, fieldName = 'image') {
  const filename = uri.split('/').pop() || `category-${Date.now()}.jpg`;
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const type = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  formData.append(fieldName, { uri, name: filename, type });
}
