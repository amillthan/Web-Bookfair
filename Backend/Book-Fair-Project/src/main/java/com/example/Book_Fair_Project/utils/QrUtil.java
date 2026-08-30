package com.example.Book_Fair_Project.utils;


import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;

public class QrUtil {

    public static byte[] toPngBytes(String text, int size) {
        try {
            if (text == null || text.isBlank()) {
                throw new IllegalArgumentException("QR text is empty");
            }

            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.MARGIN, 1);

            BitMatrix matrix = new QRCodeWriter()
                    .encode(text, BarcodeFormat.QR_CODE, size, size, hints);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR PNG", e);
        }
    }

    // ✅ optional: base64 fallback (if inline cid is blocked)
    public static String toBase64Png(String text, int size) {
        byte[] png = toPngBytes(text, size);
        return Base64.getEncoder().encodeToString(png);
    }
}

