import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as FileSystem from "expo-file-system/legacy";
import { isFirestoreError } from "../utils/firestoreErrors";
import type { UserProfile } from "../types/index";

export const uploadAvatar = async (userId: string, imageURI: string): Promise<string> => {
  try {
    const imageBlob: Blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.error("Image upload failed: ", e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", imageURI, true);
      xhr.send(null);
    });

    const firebaseRef = ref(storage, `profilePics/${userId}.jpg`);
    const metadata = {
      contentType: "image/jpeg",
    };

    await uploadBytes(firebaseRef, imageBlob, metadata);

    (imageBlob as any).close?.();
    return await getDownloadURL(firebaseRef);
  } catch (e) {
    console.error("Image upload failed: ", e);
    if (isFirestoreError(e) && e.customData && e.customData.serverResponse) {
      console.error("Server response: ", e.customData.serverResponse);
    }
    throw e;
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: { name?: string; bio?: string; avatarUrl?: string }
) => {
  const userDoc = doc(db, "users", userId);
  const finalUpdates: {
    name?: string;
    nameLower?: string;
    bio?: string;
    avatarUrl?: string | null;
  } = { ...updates };
  if (updates.name) {
    finalUpdates.nameLower = updates.name.toLowerCase();
  }
  if (finalUpdates.avatarUrl === undefined) {
    delete finalUpdates.avatarUrl;
  }

  await updateDoc(userDoc, finalUpdates);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

export const getUserProfiles = async (userIds: string[]): Promise<UserProfile[]> => {
  try {
    if (userIds.length === 0) return [];
    const profiles = await Promise.all(userIds.map((id) => getUserProfile(id)));
    return profiles.filter((p): p is UserProfile => p !== null);
  } catch (error) {
    console.error("Error fetching user profiles:", error);
    throw error;
  }
};