import React, { useState } from "react";
import imageCompression from "browser-image-compression";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../firebase"; // 👈 import your firebase.js config

const storage = getStorage(app);

export default function ImageUpload() {
  const [url, setUrl] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // 🔹 Compression settings
      const options = {
        maxSizeMB: 0.5, // target max size (0.5 MB = 500 KB)
        maxWidthOrHeight: 1200, // resize if needed
        useWebWorker: true,
      };

      // 🔹 Compress the image
      const compressedFile = await imageCompression(file, options);

      // 🔹 Upload compressed image to Firebase Storage
      const storageRef = ref(storage, `images/${compressedFile.name}`);
      await uploadBytes(storageRef, compressedFile);

      // 🔹 Get URL
      const downloadURL = await getDownloadURL(storageRef);
      setUrl(downloadURL);
      alert("Image uploaded & compressed successfully!");
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  return (
    <div className="p-6">
      <input type="file" accept="image/*" onChange={handleUpload} />
      {url && (
        <div className="mt-4">
          <img src={url} alt="Uploaded" className="rounded-xl shadow-lg max-w-sm" />
          <p className="text-sm text-gray-400">URL: {url}</p>
        </div>
      )}
    </div>
  );
}
