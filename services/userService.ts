import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as FileSystem from "expo-file-system/legacy";
import { isFirestoreError } from "../utils/firestoreErrors";

export const uploadAvatar = async (userId: string, imageURI: string): Promise<string> => {
    try {
        const base64 = await FileSystem.readAsStringAsync(imageURI, {
            encoding: FileSystem.EncodingType.Base64
        });
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

        console.log("1. User ID:", userId);
        console.log("2. Image URI:", imageURI);
        console.log("3. Blob Size:", imageBlob.size, "bytes");
        
        const firebaseRef = ref(storage, `profilePics/${userId}.jpg`);
        const metadata = {
            contentType: "image/jpeg",
        }
        await uploadBytes(firebaseRef, imageBlob, metadata);
        // @ts-expect-error
        imageBlob.close();
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
    const finalUpdates: any = { ...updates };
    if (updates.name) {
        finalUpdates.displayName = updates.name.toLowerCase();
    }
    if (finalUpdates.avatarUrl === undefined) {
        delete finalUpdates.avatarUrl;
    }
    await updateDoc(userDoc, finalUpdates);
};