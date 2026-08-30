import React, { useState, useRef } from "react";
import { UploadCloud, File, AlertCircle, X } from "lucide-react";

export default function DocumentUploader({ onFileSelected, currentFileName }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // Grouped allowed extensions matching the request
  const allowedExtensions = {
    archives: ["7z", "bdoc", "cdoc", "ddoc", "gtar", "gz", "gzip", "hqx", "rar", "sit", "tar", "tgz", "zip"],
    documents: ["doc", "docx", "epub", "gdoc", "odt", "oth", "ott", "pdf", "rtf"],
    images: ["ai", "bmp", "gdraw", "gif", "ico", "jpe", "jpeg", "jpg", "pct", "pic", "pict", "png", "svg", "svgz", "tif", "tiff", "webp"],
    json: ["json"],
    text: ["txt"]
  };

  const allAllowed = [
    ...allowedExtensions.archives,
    ...allowedExtensions.documents,
    ...allowedExtensions.images,
    ...allowedExtensions.json,
    ...allowedExtensions.text
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = (selectedFile) => {
    setError("");
    if (!selectedFile) return;

    // Validate size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File exceeds the maximum limit of 10MB.");
      return;
    }

    // Validate extension
    const extension = selectedFile.name.split(".").pop().toLowerCase();
    if (!allAllowed.includes(extension)) {
      setError(`Unsupported file type: .${extension}. Only specific Archives, Documents, Images, JSON, and Text files are accepted.`);
      return;
    }

    setFile(selectedFile);

    // Convert file to Base64
    const reader = new FileReader();
    reader.onload = () => {
      onFileSelected(selectedFile.name, reader.result);
    };
    reader.onerror = () => {
      setError("Error reading the file.");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const clearSelectedFile = () => {
    setFile(null);
    setError("");
    onFileSelected("", "");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Upload Stall Document <span className="text-gray-400 font-normal">(Optional, Max 10MB)</span>
      </label>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 mb-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      {!file && !currentFileName ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
            dragActive
              ? "border-blue-600 bg-blue-50/40"
              : "border-gray-300 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept={allAllowed.map(ext => `.${ext}`).join(",")}
          />
          <div className="p-3 bg-white rounded-full shadow-md text-blue-600 mb-4 transition-transform hover:scale-110">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Drag and drop your file here, or <span className="text-blue-600 hover:underline">browse</span>
          </p>
          <p className="text-xs text-gray-400 text-center max-w-md">
            Accepted: PDF, Word (.doc/x), Images (.png, .jpg, .svg, .webp), Archives (.zip, .7z, .rar, .tar.gz), Text (.txt), JSON (.json)
          </p>
        </div>
      ) : (
        /* Selected File Status Card */
        <div className="flex items-center justify-between p-4 bg-blue-50/30 border border-blue-100 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100/50 text-blue-600 rounded-xl">
              <File className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                {file ? file.name : currentFileName}
              </p>
              {file && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={clearSelectedFile}
            className="p-1.5 hover:bg-gray-200/50 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
