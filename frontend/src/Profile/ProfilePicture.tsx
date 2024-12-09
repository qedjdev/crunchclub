import React, { useRef, useState } from 'react';
import { FaUser } from 'react-icons/fa';
import axios from 'axios';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ProfilePictureProps {
  userId: string;
  imageUrl?: string;
  isCurrentUser: boolean;
  onUpdate: (newImageUrl: string) => void;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  userId,
  imageUrl,
  isCurrentUser,
  onUpdate
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100
  });
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const handleClick = () => {
    if (isCurrentUser && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        setPreviewUrl(img.src);
        setShowCropModal(true);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async () => {
    if (!selectedFile || !crop || !imageDimensions || !previewImageRef.current) {
      console.error('Missing required data:', {
        hasFile: !!selectedFile,
        hasCrop: !!crop,
        dimensions: imageDimensions,
        hasPreviewRef: !!previewImageRef.current
      });
      return;
    }

    const scaleX = imageDimensions.width / previewImageRef.current.width;
    const scaleY = imageDimensions.height / previewImageRef.current.height;

    const scaledCrop = {
      x: Math.round(crop.x * scaleX),
      y: Math.round(crop.y * scaleY),
      width: Math.round(crop.width * scaleX),
      height: Math.round(crop.height * scaleY)
    };

    console.log('Original crop (preview px):', crop);
    console.log('Image dimensions:', imageDimensions);
    console.log('Preview dimensions:', {
      width: previewImageRef.current.width,
      height: previewImageRef.current.height
    });
    console.log('Scale factors:', { scaleX, scaleY });
    console.log('Scaled crop (original px):', scaledCrop);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('x', scaledCrop.x.toString());
    formData.append('y', scaledCrop.y.toString());
    formData.append('width', scaledCrop.width.toString());

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_REMOTE_SERVER}/api/users/${userId}/profile-picture`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      );

      onUpdate(response.data.profilePicture);
      setShowCropModal(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setImageDimensions(null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture: ' + (error as Error).message);
    }
  };

  return (
    <>
      <div style={styles.container}>
        {imageUrl ? (
          <img
            src={`${process.env.REACT_APP_REMOTE_SERVER}${imageUrl}`}
            alt="Profile"
            style={styles.image}
            onClick={handleClick}
          />
        ) : (
          <div style={styles.placeholder} onClick={handleClick}>
            <FaUser size={50} color="#666" />
          </div>
        )}
        {isCurrentUser && (
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={styles.fileInput}
          />
        )}
      </div>

      {showCropModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Crop Your Profile Picture</h3>
            <div style={styles.cropContainer}>
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                aspect={1}
                circularCrop
                minWidth={100}
                minHeight={100}
              >
                <img
                  ref={previewImageRef}
                  src={previewUrl}
                  alt="Preview"
                  style={{ maxHeight: '70vh', maxWidth: '100%' }}
                />
              </ReactCrop>
            </div>
            <div style={styles.modalButtons}>
              <button
                onClick={handleCropComplete}
                style={styles.saveButton}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setSelectedFile(null);
                  setPreviewUrl('');
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  container: {
    width: '100px',
    height: '100px',
    margin: '0 auto',
    cursor: 'pointer',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInput: {
    display: 'none',
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    maxWidth: '90%',
    maxHeight: '90%',
    overflow: 'auto',
  },
  cropContainer: {
    maxWidth: '500px',
    maxHeight: '500px',
    margin: '20px 0',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '100%',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  },
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default ProfilePicture;

export { };