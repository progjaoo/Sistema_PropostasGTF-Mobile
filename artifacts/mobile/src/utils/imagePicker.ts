import * as ImagePicker from 'expo-image-picker';

export type PickedImage = {
  dataUrl: string;
  uri: string;
};

export async function pickImageDataUrl(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Permita acesso a galeria para escolher a imagem.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.72,
    base64: true,
  });

  if (result.canceled || !result.assets[0]?.base64) return null;

  const asset = result.assets[0];
  const mime = asset.mimeType || 'image/jpeg';
  return {
    uri: asset.uri,
    dataUrl: `data:${mime};base64,${asset.base64}`,
  };
}
