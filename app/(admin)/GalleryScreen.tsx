import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { galleryState } from "../../services/galleryState";

export default function GalleryScreen() {
  useEffect(() => {
    handlePick();
  }, []);

  const handlePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        galleryState.resolve(result.assets.map((a) => a.uri));
      }
    } catch (error) {
      console.log("Gallery error:", error);
    } finally {
      router.back();
    }
  };

  return <View style={{ flex: 1, backgroundColor: "#fff" }} />;
}
