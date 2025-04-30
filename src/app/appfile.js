/**
 * Actify File Management System
 * A comprehensive solution for handling application files in the Actify UI library
 * @version 1.3.7
 * @license MIT
 */

'use strict';

const VERSION = '1.3.7';
const DEFAULT_CHUNK_SIZE = 1024 * 1024 * 5; // 5MB
const SUPPORTED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'application/octet-stream'
];

class ActifyFileError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'ActifyFileError';
        this.code = code || 'FILE_ERROR';
        this.timestamp = new Date().toISOString();
    }
}

class FileMetadata {
    constructor(file) {
        if (!file) {
            throw new ActifyFileError('File object is required', 'INVALID_FILE');
        }

        this.id = this._generateFileId();
        this.name = file.name;
        this.size = file.size;
        this.type = file.type;
        this.lastModified = file.lastModified;
        this.extension = this._getFileExtension(file.name);
        this.uploadDate = new Date().toISOString();
        this.customMetadata = {};
        this.status = 'pending';
        this.checksum = null;
        this.dimensions = null;
        this.duration = null;
        this.owner = 'system';
        this.permissions = {
            read: true,
            write: true,
            delete: false,
            share: false
        };
    }

    _generateFileId() {
        return 'file_' + Math.random().toString(36).substr(2, 9) + 
               '_' + Date.now().toString(36);
    }

    _getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    setCustomMetadata(key, value) {
        if (typeof key !== 'string' || value === undefined) {
            throw new ActifyFileError('Invalid metadata key or value', 'INVALID_METADATA');
        }
        this.customMetadata[key] = value;
        return this;
    }

    getCustomMetadata(key) {
        return this.customMetadata[key];
    }

    updateStatus(status) {
        const validStatuses = ['pending', 'uploading', 'uploaded', 'processing', 'ready', 'error'];
        if (!validStatuses.includes(status)) {
            throw new ActifyFileError(`Invalid status: ${status}`, 'INVALID_STATUS');
        }
        this.status = status;
        return this;
    }

    setChecksum(checksum) {
        if (typeof checksum !== 'string' || !checksum) {
            throw new ActifyFileError('Checksum must be a non-empty string', 'INVALID_CHECKSUM');
        }
        this.checksum = checksum;
        return this;
    }

    setDimensions(width, height) {
        if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
            throw new ActifyFileError('Dimensions must be positive numbers', 'INVALID_DIMENSIONS');
        }
        this.dimensions = { width, height };
        return this;
    }

    setDuration(seconds) {
        if (typeof seconds !== 'number' || seconds < 0) {
            throw new ActifyFileError('Duration must be a positive number', 'INVALID_DURATION');
        }
        this.duration = seconds;
        return this;
    }

    setOwner(ownerId) {
        if (typeof ownerId !== 'string' || !ownerId) {
            throw new ActifyFileError('Owner ID must be a non-empty string', 'INVALID_OWNER');
        }
        this.owner = ownerId;
        return this;
    }

    updatePermission(permission, value) {
        if (!(permission in this.permissions)) {
            throw new ActifyFileError(`Invalid permission: ${permission}`, 'INVALID_PERMISSION');
        }
        if (typeof value !== 'boolean') {
            throw new ActifyFileError('Permission value must be boolean', 'INVALID_PERMISSION_VALUE');
        }
        this.permissions[permission] = value;
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            size: this.size,
            type: this.type,
            extension: this.extension,
            lastModified: this.lastModified,
            uploadDate: this.uploadDate,
            status: this.status,
            checksum: this.checksum,
            dimensions: this.dimensions,
            duration: this.duration,
            owner: this.owner,
            permissions: { ...this.permissions },
            customMetadata: { ...this.customMetadata }
        };
    }
}

class FileChunker {
    constructor(file, chunkSize = DEFAULT_CHUNK_SIZE) {
        this.file = file;
        this.chunkSize = chunkSize;
        this.totalChunks = Math.ceil(file.size / chunkSize);
        this.currentChunk = 0;
        this.loadedBytes = 0;
        this.progress = 0;
    }

    getNextChunk() {
        if (this.currentChunk >= this.totalChunks) {
            return null;
        }

        const start = this.currentChunk * this.chunkSize;
        const end = Math.min(start + this.chunkSize, this.file.size);
        const chunk = this.file.slice(start, end);

        this.currentChunk++;
        this.loadedBytes = end;
        this.progress = (this.loadedBytes / this.file.size) * 100;

        return {
            chunk,
            metadata: {
                chunkNumber: this.currentChunk,
                totalChunks: this.totalChunks,
                chunkSize: chunk.size,
                fileSize: this.file.size,
                fileName: this.file.name,
                fileType: this.file.type,
                progress: this.progress
            }
        };
    }

    reset() {
        this.currentChunk = 0;
        this.loadedBytes = 0;
        this.progress = 0;
    }

    hasMoreChunks() {
        return this.currentChunk < this.totalChunks;
    }
}

class FileValidator {
    static validateFile(file, options = {}) {
        const {
            maxSize = Infinity,
            allowedTypes = SUPPORTED_MIME_TYPES,
            requiredExtensions = null,
            forbiddenExtensions = null
        } = options;

        // Basic file validation
        if (!file || !(file instanceof File || file instanceof Blob)) {
            throw new ActifyFileError('Invalid file object provided', 'INVALID_FILE');
        }

        // Size validation
        if (file.size > maxSize) {
            throw new ActifyFileError(
                `File size exceeds maximum allowed size of ${maxSize} bytes`,
                'FILE_SIZE_EXCEEDED'
            );
        }

        // MIME type validation
        if (!allowedTypes.includes(file.type) && allowedTypes !== '*') {
            throw new ActifyFileError(
                `File type ${file.type} is not allowed`,
                'INVALID_FILE_TYPE'
            );
        }

        // Extension validation
        const fileName = file.name || '';
        const fileExtension = fileName.split('.').pop().toLowerCase();

        if (requiredExtensions && !requiredExtensions.includes(fileExtension)) {
            throw new ActifyFileError(
                `File extension .${fileExtension} is not allowed`,
                'INVALID_FILE_EXTENSION'
            );
        }

        if (forbiddenExtensions && forbiddenExtensions.includes(fileExtension)) {
            throw new ActifyFileError(
                `File extension .${fileExtension} is forbidden`,
                'FORBIDDEN_FILE_EXTENSION'
            );
        }

        return true;
    }

    static async calculateChecksum(file, algorithm = 'SHA-256') {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new ActifyFileError('File is required for checksum calculation', 'MISSING_FILE'));
                return;
            }

            const chunkSize = 1024 * 1024 * 2; // 2MB chunks
            const chunks = Math.ceil(file.size / chunkSize);
            const chunkPromises = [];

            for (let i = 0; i < chunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);

                chunkPromises.push(
                    new Promise((resolveChunk) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            resolveChunk(new Uint8Array(e.target.result));
                        };
                        reader.readAsArrayBuffer(chunk);
                    })
                );
            }

            Promise.all(chunkPromises)
                .then(async (chunkBuffers) => {
                    try {
                        const concatenated = new Uint8Array(file.size);
                        let offset = 0;
                        for (const chunk of chunkBuffers) {
                            concatenated.set(chunk, offset);
                            offset += chunk.length;
                        }

                        const hashBuffer = await crypto.subtle.digest(algorithm, concatenated);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                        resolve(hashHex);
                    } catch (error) {
                        reject(new ActifyFileError(
                            `Failed to calculate checksum: ${error.message}`,
                            'CHECKSUM_CALCULATION_FAILED'
                        ));
                    }
                })
                .catch(error => {
                    reject(new ActifyFileError(
                        `Failed to read file chunks: ${error.message}`,
                        'FILE_READ_ERROR'
                    ));
                });
        });
    }

    static async isFileCorrupted(file, expectedChecksum) {
        try {
            const actualChecksum = await this.calculateChecksum(file);
            return actualChecksum !== expectedChecksum;
        } catch (error) {
            throw new ActifyFileError(
                `Failed to verify file integrity: ${error.message}`,
                'INTEGRITY_CHECK_FAILED'
            );
        }
    }
}

class FileProcessor {
    constructor() {
        this.processors = new Map();
        this.registerDefaultProcessors();
    }

    registerDefaultProcessors() {
        this.registerProcessor('image/*', this.processImage.bind(this));
        this.registerProcessor('application/pdf', this.processPdf.bind(this));
        this.registerProcessor('text/*', this.processText.bind(this));
        this.registerProcessor('application/json', this.processJson.bind(this));
    }

    registerProcessor(mimePattern, processorFn) {
        if (typeof processorFn !== 'function') {
            throw new ActifyFileError('Processor must be a function', 'INVALID_PROCESSOR');
        }
        this.processors.set(mimePattern, processorFn);
    }

    async processFile(file, metadata) {
        if (!file || !metadata) {
            throw new ActifyFileError('File and metadata are required for processing', 'MISSING_ARGUMENTS');
        }

        metadata.updateStatus('processing');

        try {
            // Find matching processor
            let processor = null;
            for (const [pattern, processorFn] of this.processors) {
                if (this._matchMimeType(pattern, file.type)) {
                    processor = processorFn;
                    break;
                }
            }

            if (!processor) {
                processor = this.processGenericFile.bind(this);
            }

            const result = await processor(file, metadata);
            metadata.updateStatus('ready');
            return result;
        } catch (error) {
            metadata.updateStatus('error');
            throw error;
        }
    }

    _matchMimeType(pattern, mimeType) {
        if (pattern === '*') return true;
        if (pattern === mimeType) return true;
        if (pattern.endsWith('/*') && mimeType.startsWith(pattern.split('/*')[0])) {
            return true;
        }
        return false;
    }

    async processImage(file, metadata) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                metadata.setDimensions(img.width, img.height);
                URL.revokeObjectURL(url);
                resolve({
                    dimensions: { width: img.width, height: img.height },
                    aspectRatio: img.width / img.height,
                    processed: true
                });
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new ActifyFileError('Failed to process image', 'IMAGE_PROCESSING_ERROR'));
            };

            img.src = url;
        });
    }

    async processPdf(file, metadata) {
        return {
            processed: true,
            pageCount: null, // Would be extracted from PDF
            pdfInfo: {
                version: null,
                isEncrypted: false
            }
        };
    }

    async processText(file, metadata) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const content = event.target.result;
                const lineCount = content.split('\n').length;
                const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
                const charCount = content.length;

                resolve({
                    contentPreview: content.substring(0, 500), // First 500 chars
                    lineCount,
                    wordCount,
                    charCount,
                    processed: true
                });
            };

            reader.onerror = () => {
                reject(new ActifyFileError('Failed to read text file', 'TEXT_READ_ERROR'));
            };

            reader.readAsText(file);
        });
    }

    async processJson(file, metadata) {
        return this.processText(file, metadata).then(async (textResult) => {
            try {
                const jsonData = JSON.parse(textResult.contentPreview);
                return {
                    ...textResult,
                    jsonData,
                    isValidJson: true,
                    processed: true
                };
            } catch (error) {
                return {
                    ...textResult,
                    jsonData: null,
                    isValidJson: false,
                    processed: true,
                    error: 'Failed to parse JSON'
                };
            }
        });
    }

    async processGenericFile(file, metadata) {
        // Default processing for unsupported file types
        return {
            processed: true,
            message: 'File was stored without special processing'
        };
    }
}

class FileCache {
    constructor(maxSize = 1024 * 1024 * 100) { // 100MB default cache
        this.maxSize = maxSize;
        this.currentSize = 0;
        this.cache = new Map();
        this.accessTimes = new Map();
    }

    addFile(fileId, file, metadata) {
        if (this.cache.has(fileId)) {
            this._updateAccessTime(fileId);
            return false;
        }

        const fileSize = file.size;
        if (fileSize > this.maxSize) {
            return false; // File too large for cache
        }

        // Make space if needed
        while (this.currentSize + fileSize > this.maxSize && this.cache.size > 0) {
            this._evictOldest();
        }

        this.cache.set(fileId, { file, metadata });
        this.accessTimes.set(fileId, Date.now());
        this.currentSize += fileSize;
        return true;
    }

    getFile(fileId) {
        if (!this.cache.has(fileId)) {
            return null;
        }

        this._updateAccessTime(fileId);
        return this.cache.get(fileId);
    }

    hasFile(fileId) {
        return this.cache.has(fileId);
    }

    removeFile(fileId) {
        if (!this.cache.has(fileId)) {
            return false;
        }

        const fileSize = this.cache.get(fileId).file.size;
        this.cache.delete(fileId);
        this.accessTimes.delete(fileId);
        this.currentSize -= fileSize;
        return true;
    }

    clear() {
        this.cache.clear();
        this.accessTimes.clear();
        this.currentSize = 0;
    }

    getStats() {
        return {
            maxSize: this.maxSize,
            currentSize: this.currentSize,
            fileCount: this.cache.size,
            utilization: (this.currentSize / this.maxSize) * 100
        };
    }

    _updateAccessTime(fileId) {
        this.accessTimes.set(fileId, Date.now());
    }

    _evictOldest() {
        let oldestId = null;
        let oldestTime = Infinity;

        for (const [id, time] of this.accessTimes) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestId = id;
            }
        }

        if (oldestId) {
            this.removeFile(oldestId);
        }
    }
}

class FileEventEmitter {
    constructor() {
        this.events = {};
    }

    on(eventName, listener) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(listener);
        return this;
    }

    once(eventName, listener) {
        const onceWrapper = (...args) => {
            this.off(eventName, onceWrapper);
            listener.apply(this, args);
        };
        return this.on(eventName, onceWrapper);
    }

    off(eventName, listenerToRemove) {
        if (!this.events[eventName]) return this;
        
        this.events[eventName] = this.events[eventName].filter(
            listener => listener !== listenerToRemove
        );
        
        return this;
    }

    emit(eventName, ...args) {
        if (!this.events[eventName]) return false;
        
        this.events[eventName].forEach(listener => {
            try {
                listener.apply(this, args);
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
        
        return true;
    }

    removeAllListeners(eventName) {
        if (eventName) {
            delete this.events[eventName];
        } else {
            this.events = {};
        }
        return this;
    }
}

class ActifyFileManager extends FileEventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxFileSize: 1024 * 1024 * 50, // 50MB
            allowedTypes: [...SUPPORTED_MIME_TYPES],
            enableCache: true,
            cacheSize: 1024 * 1024 * 100, // 100MB
            chunkSize: DEFAULT_CHUNK_SIZE,
            autoProcess: true,
            ...options
        };

        this.fileCache = this.options.enableCache 
            ? new FileCache(this.options.cacheSize) 
            : null;
        this.fileProcessor = new FileProcessor();
        this.pendingFiles = new Map();
        this.uploadQueue = [];
        this.isUploading = false;
        this.uploadConcurrency = 3;
        this.activeUploads = 0;
        this.uploadSpeed = 0;
        this.lastSpeedCalculation = Date.now();
        this.bytesUploadedSinceCalc = 0;

        this._setupInternalEvents();
    }

    _setupInternalEvents() {
        // Internal error handling
        process.on('unhandledRejection', (error) => {
            this.emit('error', new ActifyFileError(
                `Unhandled rejection: ${error.message}`,
                'UNHANDLED_REJECTION'
            ));
        });

        // Speed calculation interval
        this.speedInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = (now - this.lastSpeedCalculation) / 1000; // in seconds
            if (elapsed > 0) {
                this.uploadSpeed = this.bytesUploadedSinceCalc / elapsed;
                this.bytesUploadedSinceCalc = 0;
                this.lastSpeedCalculation = now;
                this.emit('uploadSpeed', this.uploadSpeed);
            }
        }, 1000);
    }

    async registerFile(file, customMetadata = {}) {
        try {
            // Validate the file first
            FileValidator.validateFile(file, {
                maxSize: this.options.maxFileSize,
                allowedTypes: this.options.allowedTypes
            });

            // Create file metadata
            const metadata = new FileMetadata(file);
            
            // Add custom metadata
            Object.keys(customMetadata).forEach(key => {
                metadata.setCustomMetadata(key, customMetadata[key]);
            });

            // Calculate checksum for file integrity
            try {
                const checksum = await FileValidator.calculateChecksum(file);
                metadata.setChecksum(checksum);
            } catch (checksumError) {
                console.warn('Failed to calculate file checksum:', checksumError);
            }

            // Add to pending files
            this.pendingFiles.set(metadata.id, { file, metadata });

            // Add to upload queue
            this.uploadQueue.push(metadata.id);

            // Emit events
            this.emit('fileAdded', {
                fileId: metadata.id,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                metadata: metadata.toJSON()
            });

            // Start processing queue if not already running
            if (!this.isUploading && this.options.autoProcess) {
                this._processUploadQueue();
            }

            return metadata.id;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async _processUploadQueue() {
        if (this.isUploading || this.uploadQueue.length === 0) return;
        
        this.isUploading = true;
        this.emit('uploadStart');

        while (this.uploadQueue.length > 0 && this.activeUploads < this.uploadConcurrency) {
            const fileId = this.uploadQueue.shift();
            if (!this.pendingFiles.has(fileId)) continue;
            
            this.activeUploads++;
            const { file, metadata } = this.pendingFiles.get(fileId);
            
            try {
                metadata.updateStatus('uploading');
                this.emit('fileUploadStart', { fileId, metadata: metadata.toJSON() });

                const chunker = new FileChunker(file, this.options.chunkSize);
                const totalChunks = chunker.totalChunks;
                
                while (chunker.hasMoreChunks()) {
                    const { chunk, metadata: chunkMetadata } = chunker.getNextChunk();
                    
                    // Simulate network delay
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // Update speed calculation
                    this.bytesUploadedSinceCalc += chunk.size;
                    
                    this.emit('uploadProgress', {
                        fileId,
                        progress: chunkMetadata.progress,
                        chunkNumber: chunkMetadata.chunkNumber,
                        totalChunks,
                        bytesUploaded: chunkMetadata.chunkSize,
                        totalBytes: chunkMetadata.fileSize
                    });
                }

                // Add to cache if enabled
                if (this.fileCache) {
                    this.fileCache.addFile(fileId, file, metadata);
                }

                // Process the file if enabled
                if (this.options.autoProcess) {
                    await this.fileProcessor.processFile(file, metadata);
                }

                // Mark as complete
                this.pendingFiles.delete(fileId);
                this.emit('fileUploadComplete', {
                    fileId,
                    metadata: metadata.toJSON(),
                    fileUrl: this._generateFileUrl(fileId)
                });
            } catch (error) {
                metadata.updateStatus('error');
                this.emit('fileUploadError', {
                    fileId,
                    error,
                    metadata: metadata.toJSON()
                });
            } finally {
                this.activeUploads--;
            }
        }

        this.isUploading = this.activeUploads > 0;
        if (!this.isUploading) {
            this.emit('uploadComplete');
        } else {
            // Continue processing if there are still active uploads
            setTimeout(() => this._processUploadQueue(), 100);
        }
    }

    _generateFileUrl(fileId) {
        return `actify://files/${fileId}`;
    }

    async getFile(fileId) {
        try {
            // Check cache first
            if (this.fileCache && this.fileCache.hasFile(fileId)) {
                const cached = this.fileCache.getFile(fileId);
                this.emit('fileRetrieved', { fileId, fromCache: true });
                return cached;
            }

            // Check pending files
            if (this.pendingFiles.has(fileId)) {
                const pending = this.pendingFiles.get(fileId);
                this.emit('fileRetrieved', { fileId, fromCache: false, status: pending.metadata.status });
                return pending;
            }

            throw new ActifyFileError('File not found', 'FILE_NOT_FOUND');
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async getFileMetadata(fileId) {
        try {
            // Check cache first
            if (this.fileCache && this.fileCache.hasFile(fileId)) {
                const cached = this.fileCache.getFile(fileId);
                return cached.metadata.toJSON();
            }

            // Check pending files
            if (this.pendingFiles.has(fileId)) {
                return this.pendingFiles.get(fileId).metadata.toJSON();
            }

            throw new ActifyFileError('File metadata not found', 'METADATA_NOT_FOUND');
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async removeFile(fileId) {
        try {
            // Remove from cache
            if (this.fileCache) {
                this.fileCache.removeFile(fileId);
            }

            // Remove from pending files
            if (this.pendingFiles.has(fileId)) {
                this.pendingFiles.delete(fileId);
            }

            // Remove from upload queue
            this.uploadQueue = this.uploadQueue.filter(id => id !== fileId);

            this.emit('fileRemoved', { fileId });
            
            return true;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async processFile(fileId, processorOptions = {}) {
        try {
            const fileData = await this.getFile(fileId);
            if (!fileData) {
                throw new ActifyFileError('File not found', 'FILE_NOT_FOUND');
            }

            const { file, metadata } = fileData;
            const result = await this.fileProcessor.processFile(file, metadata, processorOptions);
            
            this.emit('fileProcessed', {
                fileId,
                metadata: metadata.toJSON(),
                processingResult: result
            });
            
            return result;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    pauseUploads() {
        this.isUploading = false;
        this.emit('uploadsPaused');
    }

    resumeUploads() {
        if (!this.isUploading && this.uploadQueue.length > 0) {
            this._processUploadQueue();
        }
    }

    clearPendingFiles() {
        this.pendingFiles.clear();
        this.uploadQueue = [];
        this.emit('pendingFilesCleared');
    }

    getUploadStats() {
        return {
            queueLength: this.uploadQueue.length,
            activeUploads: this.activeUploads,
            uploadSpeed: this.uploadSpeed,
            pendingFiles: this.pendingFiles.size,
            cacheStats: this.fileCache ? this.fileCache.getStats() : null
        };
    }

    destroy() {
        clearInterval(this.speedInterval);
        this.removeAllListeners();
        this.pendingFiles.clear();
        this.uploadQueue = [];
        if (this.fileCache) {
            this.fileCache.clear();
        }
    }
}

// Export the main class and supporting classes
export {
    ActifyFileManager as default,
    FileMetadata,
    FileChunker,
    FileValidator,
    FileProcessor,
    FileCache,
    ActifyFileError,
    SUPPORTED_MIME_TYPES,
    VERSION
};
