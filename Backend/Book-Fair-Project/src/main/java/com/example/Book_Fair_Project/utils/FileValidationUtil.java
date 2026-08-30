package com.example.Book_Fair_Project.utils;

import java.nio.file.Paths;
import java.util.*;

public class FileValidationUtil {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    // Allowed extensions grouped by categories as requested
    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>();

    static {
        // Archive files
        ALLOWED_EXTENSIONS.addAll(Arrays.asList(
            "7z", "bdoc", "cdoc", "ddoc", "gtar", "gz", "gzip", "hqx", "rar", "sit", "tar", "tgz", "zip"
        ));
        // Document files
        ALLOWED_EXTENSIONS.addAll(Arrays.asList(
            "doc", "docx", "epub", "gdoc", "odt", "oth", "ott", "pdf", "rtf"
        ));
        // Image files
        ALLOWED_EXTENSIONS.addAll(Arrays.asList(
            "ai", "bmp", "gdraw", "gif", "ico", "jpe", "jpeg", "jpg", "pct", "pic", "pict", "png", "svg", "svgz", "tif", "tiff", "webp"
        ));
        // JSON text
        ALLOWED_EXTENSIONS.add("json");
        // Text file
        ALLOWED_EXTENSIONS.add("txt");
    }

    /**
     * Sanitizes a filename to prevent path traversal and shell injection attacks.
     * Replaces special characters except dots, hyphens, and underscores.
     */
    public static String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "unnamed_file_" + UUID.randomUUID();
        }

        // 1. Get the actual filename without path parts (prevents path traversal)
        String baseName = Paths.get(filename).getFileName().toString();

        // 2. Strip standard dangerous directory navigation patterns
        baseName = baseName.replace("..", "").replace("/", "").replace("\\", "");

        // 3. Remove non-alphanumeric/dot/hyphen/underscore characters
        String cleanName = baseName.replaceAll("[^a-zA-Z0-9\\.\\-_]", "_");

        if (cleanName.isBlank()) {
            return "sanitized_file_" + UUID.randomUUID();
        }
        return cleanName;
    }

    /**
     * Validates that the file size is under the 10MB limit.
     */
    public static void validateSize(byte[] fileContent) {
        if (fileContent == null || fileContent.length == 0) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }
        if (fileContent.length > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds the maximum limit of 10MB.");
        }
    }

    /**
     * Validates file extension and content magic bytes to prevent spoofing.
     */
    public static void validateFileType(String filename, byte[] fileContent) {
        if (filename == null || !filename.contains(".")) {
            throw new IllegalArgumentException("File must have a valid extension.");
        }

        String extension = filename.substring(filename.lastIndexOf(".") + 1).trim().toLowerCase();

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported file type: ." + extension);
        }

        // Perform magic byte (header signature) validation to prevent masquerading
        validateMagicBytes(extension, fileContent);
    }

    private static void validateMagicBytes(String extension, byte[] data) {
        if (data == null || data.length < 4) {
            return; // Too short to validate magic bytes, standard checks will pass
        }

        // Convert the first 4 bytes to hex string for comparison
        String hex = String.format("%02X%02X%02X%02X", data[0], data[1], data[2], data[3]);

        switch (extension) {
            case "pdf":
                if (!hex.startsWith("25504446")) { // %PDF
                    throw new IllegalArgumentException("File masquerading detected: Declared as PDF but signature mismatch.");
                }
                break;
            case "png":
                if (!hex.startsWith("89504E47")) { // .PNG
                    throw new IllegalArgumentException("File masquerading detected: Declared as PNG but signature mismatch.");
                }
                break;
            case "jpg":
            case "jpeg":
            case "jpe":
                if (!hex.startsWith("FFD8FF")) { // JPEG start bytes
                    throw new IllegalArgumentException("File masquerading detected: Declared as JPEG but signature mismatch.");
                }
                break;
            case "gif":
                if (!hex.startsWith("47494638")) { // GIF8 (GIF87a / GIF89a)
                    throw new IllegalArgumentException("File masquerading detected: Declared as GIF but signature mismatch.");
                }
                break;
            case "bmp":
                if (!hex.startsWith("424D")) { // BM
                    throw new IllegalArgumentException("File masquerading detected: Declared as BMP but signature mismatch.");
                }
                break;
            case "zip":
            case "docx":
            case "epub":
                if (!hex.startsWith("504B0304")) { // PK.. (ZIP archive header)
                    throw new IllegalArgumentException("File masquerading detected: Declared as ZIP/Office Open XML but signature mismatch.");
                }
                break;
            case "7z":
                if (!hex.startsWith("377ABCAF")) { // 7z
                    throw new IllegalArgumentException("File masquerading detected: Declared as 7z but signature mismatch.");
                }
                break;
            case "gz":
            case "gzip":
                if (!hex.startsWith("1F8B")) { // GZIP
                    throw new IllegalArgumentException("File masquerading detected: Declared as GZIP but signature mismatch.");
                }
                break;
            case "rar":
                if (!hex.startsWith("52617221")) { // Rar!
                    throw new IllegalArgumentException("File masquerading detected: Declared as RAR but signature mismatch.");
                }
                break;
            case "tif":
            case "tiff":
                if (!hex.startsWith("49492A00") && !hex.startsWith("4D4D002A")) { // II* or MM*
                    throw new IllegalArgumentException("File masquerading detected: Declared as TIFF but signature mismatch.");
                }
                break;
            case "ico":
                if (!hex.startsWith("00000100")) { // ICO header
                    throw new IllegalArgumentException("File masquerading detected: Declared as ICO but signature mismatch.");
                }
                break;
        }
    }
}
