import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    // Handle incoming links and file shares
    const handleIncomingLink = async (event: { url: string }) => {
      console.log('Incoming link:', event.url);
      
      try {
        // Check if it's a file URL
        if (event.url.startsWith('file://') || event.url.startsWith('content://')) {
          await handleIncomingFile(event.url);
        }
      } catch (error) {
        console.error('Error handling incoming link:', error);
        Alert.alert('Error', 'Failed to process shared file');
      }
    };

    // Handle initial URL if app was opened via file share
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleIncomingLink({ url });
      }
    });

    // Listen for incoming links while app is running
    const subscription = Linking.addEventListener('url', handleIncomingLink);

    return () => {
      subscription?.remove();
    };
  }, []);

  const handleIncomingFile = async (fileUrl: string) => {
    try {
      console.log('Processing incoming file:', fileUrl);
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUrl);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Determine file type
      let fileType: 'pdf' | 'docx' = 'pdf';
      const fileName = fileInfo.uri.split('/').pop() || '';
      
      if (fileName.toLowerCase().endsWith('.docx')) {
        fileType = 'docx';
      } else if (fileName.toLowerCase().endsWith('.pdf')) {
        fileType = 'pdf';
      } else {
        Alert.alert('Unsupported File', 'Please share a PDF or DOCX file');
        return;
      }

      // Copy file to app's document directory
      const newFileName = `shared_${Date.now()}_${fileName}`;
      const newFilePath = `${FileSystem.documentDirectory}${newFileName}`;
      
      await FileSystem.copyAsync({
        from: fileUrl,
        to: newFilePath
      });

      console.log('File copied to:', newFilePath);

      // Navigate to document processor with the file
      const router = require('expo-router').router;
      router.push({
        pathname: '/document-processor',
        params: {
          uri: newFilePath,
          name: fileName,
          size: fileInfo.size,
          type: fileType,
          mimeType: fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      });

    } catch (error) {
      console.error('Error processing incoming file:', error);
      Alert.alert('Error', 'Failed to process shared file');
    }
  };

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="document-processor" options={{ headerShown: false }} />
        <Stack.Screen name="signature-manager" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
