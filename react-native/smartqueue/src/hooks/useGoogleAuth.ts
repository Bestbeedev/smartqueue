import { useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { authApi, GoogleAuthData } from '../api/authApi';
import { useAuth } from '../store/authStore';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthResult {
  success: boolean;
  error?: string;
}

export const useGoogleAuth = () => {
  const { login: setAuthUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '549011846244-bjm9d1imp4h3bbjd7u4vt7p2p2s1th8f.apps.googleusercontent.com',
    iosClientId: '549011846244-nim8slhg25jfd2qk1fb9mfobdio4o2h8.apps.googleusercontent.com',
    webClientId: '549011846244-7csqkt0jb8ltrsn82aicmur9t16gcgjg.apps.googleusercontent.com',
    redirectUri: makeRedirectUri(),
    scopes: ['openid', 'profile', 'email'],
  });

  const handleGoogleLogin = async (): Promise<GoogleAuthResult> => {
    try {
      setIsLoading(true);
      
      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { authentication } = result;
        
        if (authentication?.idToken) {
          const googleData: GoogleAuthData = {
            id_token: authentication.idToken,
            access_token: authentication.accessToken,
          };
          
          const authResponse = await authApi.googleLogin(googleData);
          
          setAuthUser({
            email: authResponse.user.email,
            password: '', // Not needed for Google auth
          });
          
          return { success: true };
        } else {
          return { success: false, error: 'No ID token received from Google' };
        }
      } else if (result.type === 'cancel') {
        return { success: false, error: 'Google sign-in was cancelled' };
      } else if (result.type === 'error') {
        return { success: false, error: result.error?.message || 'Google sign-in failed' };
      }
      
      return { success: false, error: 'Unknown error occurred' };
    } catch (error: any) {
      console.error('Google login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to sign in with Google' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async (phone?: string): Promise<GoogleAuthResult> => {
    try {
      setIsLoading(true);
      
      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { authentication } = result;
        
        if (authentication?.idToken) {
          const googleData: GoogleAuthData = {
            id_token: authentication.idToken,
            access_token: authentication.accessToken,
          };
          
          const authResponse = await authApi.googleRegister(googleData, phone);
          
          setAuthUser({
            email: authResponse.user.email,
            password: '', // Not needed for Google auth
          });
          
          return { success: true };
        } else {
          return { success: false, error: 'No ID token received from Google' };
        }
      } else if (result.type === 'cancel') {
        return { success: false, error: 'Google sign-up was cancelled' };
      } else if (result.type === 'error') {
        return { success: false, error: result.error?.message || 'Google sign-up failed' };
      }
      
      return { success: false, error: 'Unknown error occurred' };
    } catch (error: any) {
      console.error('Google register error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to sign up with Google' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    request,
    response,
    handleGoogleLogin,
    handleGoogleRegister,
  };
};
