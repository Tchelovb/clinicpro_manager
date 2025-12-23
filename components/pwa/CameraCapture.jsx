import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Circle, Image as ImageIcon } from 'lucide-react';

export default function CameraCapture({ onCapture, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // 'user' (front) or 'environment' (back)
    const [isCameraSupported, setIsCameraSupported] = useState(true);

    const startCamera = useCallback(async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported');
            }

            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 }, // Quality preference
                    height: { ideal: 720 }
                },
                audio: false
            });

            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setError(null);
        } catch (err) {
            console.error("Camera access error:", err);
            // Fallback for permission denied or unsupported
            setError(err);
            setIsCameraSupported(false);
        }
    }, [facingMode]);

    useEffect(() => {
        startCamera();
        return () => {
            // Cleanup on unmount
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]); // Re-start when facing mode changes

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Match canvas size to video stream resolution
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');

        // Optional: Flip horizontally if using front camera for mirror effect
        if (facingMode === 'user') {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get Base64
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85); // 85% quality Jpg
        onCapture(imageDataUrl);
    };

    const handleSwitchCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const handleFallbackFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onCapture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isCameraSupported) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
                <div className="bg-gray-900 p-6 rounded-xl max-w-sm w-full text-center space-y-4">
                    <div className="mx-auto bg-gray-800 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-white text-lg font-medium">Câmera indisponível</h3>
                    <p className="text-gray-400 text-sm">
                        Não conseguimos acessar sua câmera diretamente. Use o seletor de arquivos abaixo.
                    </p>

                    <label className="block w-full cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFallbackFileChange}
                        />
                        <div className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <ImageIcon className="w-5 h-5" />
                            Tirar Foto ou Escolher
                        </div>
                    </label>

                    <button
                        onClick={onClose}
                        className="w-full bg-transparent border border-gray-700 text-gray-300 py-3 rounded-lg mt-2 hover:bg-gray-800"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Viewport */}
            <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                {/* Loading / Waiting for stream */}
                {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-2"></div>
                        Carregando câmera...
                    </div>
                )}

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted // Important for autoplay policy
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* Hidden Canvas for processing */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Top Controls */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pt-safe-top bg-gradient-to-b from-black/50 to-transparent">
                    <button
                        onClick={onClose}
                        className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="bg-black/90 pb-safe-bottom pt-6 px-8 h-32 flex items-center justify-between">
                {/* Gallery / Placeholder (Left) */}
                <div className="w-12 h-12">
                    {/* Future: Gallery preview thumbnail could go here */}
                </div>

                {/* Shutter Button (Center) */}
                <button
                    onClick={handleCapture}
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-transform"
                >
                    <div className="w-16 h-16 bg-white rounded-full group-hover:bg-gray-200 transition-colors" />
                </button>

                {/* Switch Camera (Right) */}
                <button
                    onClick={handleSwitchCamera}
                    className="w-12 h-12 flex items-center justify-center bg-gray-800/80 rounded-full text-white active:rotate-180 transition-all"
                >
                    <RefreshCw className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
