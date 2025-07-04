class CodeShare {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadSharedCode();
        this.setupGlobalStorage();
    }

    setupGlobalStorage() {
        // Create a global storage namespace that can be accessed across sessions
        if (!window.globalCodeStorage) {
            // Try to load from a hidden iframe that persists data
            this.initializeGlobalStorage();
        }
    }

    initializeGlobalStorage() {
        // Use a combination of approaches for cross-device sharing
        window.globalCodeStorage = new Map();
        
        // Try to sync with any existing data in localStorage
        this.syncFromLocalStorage();
        
        // Create a global event system for sharing
        this.setupGlobalEvents();
    }

    syncFromLocalStorage() {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storageKey)) {
                    const shareId = key.replace(this.storageKey, '');
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    window.globalCodeStorage.set(shareId, data);
                }
            }
        } catch (error) {
            console.warn('Failed to sync from localStorage:', error);
        }
    }

    setupGlobalEvents() {
        // Listen for storage events across tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith(this.storageKey)) {
                const shareId = e.key.replace(this.storageKey, '');
                if (e.newValue) {
                    try {
                        const data = JSON.parse(e.newValue);
                        window.globalCodeStorage.set(shareId, data);
                    } catch (error) {
                        console.warn('Failed to parse storage event data:', error);
                    }
                }
            }
        });
    }

    initializeElements() {
        this.codeInput = document.getElementById('codeInput');
        this.shareBtn = document.getElementById('shareBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.resultSection = document.getElementById('resultSection');
        this.shareLink = document.getElementById('shareLink');
        this.detectedLanguage = document.getElementById('detectedLanguage');
        this.timer = document.getElementById('timer');
        this.timeLeft = document.getElementById('timeLeft');
        this.notification = document.getElementById('notification');
        this.codePreview = document.getElementById('codePreview');
        this.highlightedCode = document.getElementById('highlightedCode');
        this.togglePreview = document.getElementById('togglePreview');
        
        this.currentTimer = null;
        this.storageKey = 'codeShare_';
        this.isPreviewMode = false;
        
        // Clean up expired items on initialization
        this.cleanupExpiredItems();
    }

    setupEventListeners() {
        this.codeInput.addEventListener('input', this.handleCodeInput.bind(this));
        this.shareBtn.addEventListener('click', this.handleShare.bind(this));
        this.clearBtn.addEventListener('click', this.handleClear.bind(this));
        this.copyBtn.addEventListener('click', this.handleCopy.bind(this));
        this.togglePreview.addEventListener('click', this.handleTogglePreview.bind(this));
        
        // Handle tab key in textarea
        this.codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.codeInput.selectionStart;
                const end = this.codeInput.selectionEnd;
                this.codeInput.value = this.codeInput.value.substring(0, start) + 
                                     '    ' + 
                                     this.codeInput.value.substring(end);
                this.codeInput.selectionStart = this.codeInput.selectionEnd = start + 4;
            }
        });
    }

    handleCodeInput() {
        const code = this.codeInput.value;
        const language = this.detectLanguage(code);
        this.detectedLanguage.textContent = language || 'Plain Text';
        this.resultSection.classList.remove('show');
        
        // Update syntax highlighting in preview
        this.updateSyntaxHighlighting(code, language);
    }

    updateSyntaxHighlighting(code, language) {
        if (!code.trim()) {
            this.highlightedCode.textContent = '';
            return;
        }

        // Map our language detection to Prism.js language names
        const languageMap = {
            'JavaScript': 'javascript',
            'Python': 'python',
            'Java': 'java',
            'Kotlin': 'kotlin',
            'Swift': 'swift',
            'C++': 'cpp',
            'C#': 'csharp',
            'Go': 'go',
            'Rust': 'rust',
            'PHP': 'php',
            'Ruby': 'ruby',
            'JSON': 'json',
            'HTML': 'html',
            'CSS': 'css',
            'SQL': 'sql',
            'XML': 'xml',
            'Plain Text': 'text'
        };

        const prismLanguage = languageMap[language] || 'text';
        this.highlightedCode.textContent = code;
        this.highlightedCode.className = `language-${prismLanguage}`;
        
        // Apply syntax highlighting
        if (window.Prism) {
            Prism.highlightElement(this.highlightedCode);
        }
    }

    handleTogglePreview() {
        this.isPreviewMode = !this.isPreviewMode;
        
        if (this.isPreviewMode) {
            this.codePreview.classList.add('show');
            this.togglePreview.textContent = 'Edit';
            this.togglePreview.style.background = 'var(--tertiary-bg)';
            
            // Update highlighting when switching to preview
            const code = this.codeInput.value;
            const language = this.detectLanguage(code);
            this.updateSyntaxHighlighting(code, language);
        } else {
            this.codePreview.classList.remove('show');
            this.togglePreview.textContent = 'Preview';
            this.togglePreview.style.background = 'var(--accent-color)';
        }
    }

    // Enhanced storage methods for cross-device sharing
    saveToStorage(shareId, data) {
        try {
            // Add metadata for cross-system tracking
            const enhancedData = {
                ...data,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                origin: window.location.origin,
                sharedFrom: this.getSystemInfo(),
                shareId: shareId
            };
            
            // Save to localStorage (local device)
            localStorage.setItem(this.storageKey + shareId, JSON.stringify(enhancedData));
            
            // Save to sessionStorage as backup
            try {
                sessionStorage.setItem(this.storageKey + shareId, JSON.stringify(enhancedData));
            } catch (e) {
                console.warn('SessionStorage backup failed:', e);
            }
            
            // Save to global storage
            window.globalCodeStorage.set(shareId, enhancedData);
            
            // Save to a more persistent method - using a base64 encoded URL parameter approach
            this.saveToUrlBasedStorage(shareId, enhancedData);
            
            // Broadcast to other tabs/windows
            this.broadcastToOtherTabs(shareId, enhancedData);
            
            return true;
        } catch (error) {
            console.error('Failed to save to storage:', error);
            this.showNotification('Storage failed. Code sharing may not work properly.', 'error');
            return false;
        }
    }

    saveToUrlBasedStorage(shareId, data) {
        try {
            // Create a compressed version of the data for URL sharing
            const compressedData = {
                c: data.code,
                l: data.language,
                e: data.expiresAt,
                t: data.createdAt
            };
            
            // Encode the data
            const encodedData = btoa(JSON.stringify(compressedData));
            
            // Store in a special localStorage key that includes the encoded data
            const urlStorageKey = `${this.storageKey}url_${shareId}`;
            localStorage.setItem(urlStorageKey, encodedData);
            
            // Also store in a global variable for immediate access
            if (!window.urlBasedStorage) {
                window.urlBasedStorage = new Map();
            }
            window.urlBasedStorage.set(shareId, encodedData);
            
        } catch (error) {
            console.warn('URL-based storage failed:', error);
        }
    }

    getFromUrlBasedStorage(shareId) {
        try {
            // First check global variable
            if (window.urlBasedStorage && window.urlBasedStorage.has(shareId)) {
                const encodedData = window.urlBasedStorage.get(shareId);
                const compressedData = JSON.parse(atob(encodedData));
                return {
                    code: compressedData.c,
                    language: compressedData.l,
                    expiresAt: compressedData.e,
                    createdAt: compressedData.t,
                    shareId: shareId
                };
            }
            
            // Then check localStorage
            const urlStorageKey = `${this.storageKey}url_${shareId}`;
            const encodedData = localStorage.getItem(urlStorageKey);
            if (encodedData) {
                const compressedData = JSON.parse(atob(encodedData));
                return {
                    code: compressedData.c,
                    language: compressedData.l,
                    expiresAt: compressedData.e,
                    createdAt: compressedData.t,
                    shareId: shareId
                };
            }
            
            return null;
        } catch (error) {
            console.warn('Failed to get from URL-based storage:', error);
            return null;
        }
    }

    broadcastToOtherTabs(shareId, data) {
        try {
            // Use localStorage events to communicate with other tabs
            const broadcastData = {
                type: 'codeShare',
                shareId: shareId,
                data: data,
                timestamp: Date.now()
            };
            
            localStorage.setItem('codeShare_broadcast', JSON.stringify(broadcastData));
            
            // Remove the broadcast item immediately (this triggers the storage event)
            setTimeout(() => {
                localStorage.removeItem('codeShare_broadcast');
            }, 100);
        } catch (error) {
            console.warn('Failed to broadcast to other tabs:', error);
        }
    }

    getFromStorage(shareId) {
        try {
            let data = null;
            
            // Try multiple storage methods in order of preference
            
            // 1. Try global storage first (fastest)
            if (window.globalCodeStorage && window.globalCodeStorage.has(shareId)) {
                data = window.globalCodeStorage.get(shareId);
            }
            
            // 2. Try URL-based storage
            if (!data) {
                data = this.getFromUrlBasedStorage(shareId);
            }
            
            // 3. Try localStorage
            if (!data) {
                const localData = localStorage.getItem(this.storageKey + shareId);
                if (localData) {
                    data = JSON.parse(localData);
                }
            }
            
            // 4. Try sessionStorage
            if (!data) {
                const sessionData = sessionStorage.getItem(this.storageKey + shareId);
                if (sessionData) {
                    data = JSON.parse(sessionData);
                }
            }
            
            // 5. Try to extract from URL if it's encoded there
            if (!data) {
                data = this.tryExtractFromUrl(shareId);
            }
            
            if (data) {
                // Log cross-system access for debugging
                if (data.sharedFrom && data.sharedFrom !== this.getSystemInfo()) {
                    console.log('Cross-system access detected:', {
                        originalSystem: data.sharedFrom,
                        currentSystem: this.getSystemInfo()
                    });
                }
                
                // Update global storage with found data
                if (window.globalCodeStorage) {
                    window.globalCodeStorage.set(shareId, data);
                }
                
                return data;
            }
            
            return null;
        } catch (error) {
            console.error('Failed to read from storage:', error);
            return null;
        }
    }

    tryExtractFromUrl(shareId) {
        try {
            // Check if the code data is embedded in the current URL
            const urlParams = new URLSearchParams(window.location.search);
            const encodedData = urlParams.get('data');
            
            if (encodedData) {
                const compressedData = JSON.parse(atob(encodedData));
                return {
                    code: compressedData.c,
                    language: compressedData.l,
                    expiresAt: compressedData.e,
                    createdAt: compressedData.t,
                    shareId: shareId,
                    sharedFrom: 'URL_Embedded'
                };
            }
            
            return null;
        } catch (error) {
            console.warn('Failed to extract from URL:', error);
            return null;
        }
    }

    getSystemInfo() {
        const platform = navigator.platform || 'Unknown';
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const browser = this.getBrowserInfo();
        
        return `${platform}_${browser}_${isMobile ? 'Mobile' : 'Desktop'}`;
    }

    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    removeFromStorage(shareId) {
        try {
            localStorage.removeItem(this.storageKey + shareId);
            sessionStorage.removeItem(this.storageKey + shareId);
        } catch (error) {
            console.error('Failed to remove from storage:', error);
        }
    }

    cleanupExpiredItems() {
        try {
            const keysToRemove = [];
            const now = Date.now();
            
            // Check localStorage
            this.cleanupStorageType(localStorage, keysToRemove, now);
            
            // Check sessionStorage
            this.cleanupStorageType(sessionStorage, keysToRemove, now);
            
            if (keysToRemove.length > 0) {
                console.log(`Cleaned up ${keysToRemove.length} expired code shares`);
            }
        } catch (error) {
            console.error('Failed to cleanup expired items:', error);
        }
    }

    cleanupStorageType(storage, keysToRemove, now) {
        try {
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key && key.startsWith(this.storageKey)) {
                    const shareId = key.replace(this.storageKey, '');
                    const data = JSON.parse(storage.getItem(key) || '{}');
                    
                    if (data.expiresAt && now > data.expiresAt) {
                        keysToRemove.push(key);
                        storage.removeItem(key);
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to cleanup storage type:', error);
        }
    }

    detectLanguage(code) {
        if (!code.trim()) return 'Plain Text';

        // Language detection patterns
        const patterns = {
            'JavaScript': [
                /^(const|let|var)\s+\w+/m,
                /function\s+\w+\s*\(/m,
                /=>\s*{/m,
                /console\.log\(/m,
                /require\s*\(/m,
                /import\s+.*from/m
            ],
            'Python': [
                /^def\s+\w+\s*\(/m,
                /^class\s+\w+/m,
                /^import\s+\w+/m,
                /^from\s+\w+\s+import/m,
                /print\s*\(/m,
                /if\s+__name__\s*==\s*['"']__main__['"']/m
            ],
            'Java': [
                /^(public|private|protected)\s+(class|interface)/m,
                /^import\s+java\./m,
                /System\.out\.print/m,
                /public\s+static\s+void\s+main/m
            ],
            'Kotlin': [
                /^fun\s+\w+\s*\(/m,
                /^class\s+\w+/m,
                /^import\s+.*kotlin/m,
                /println\s*\(/m,
                /val\s+\w+\s*=/m,
                /var\s+\w+\s*=/m
            ],
            'Swift': [
                /^func\s+\w+\s*\(/m,
                /^class\s+\w+/m,
                /^import\s+\w+/m,
                /print\s*\(/m,
                /var\s+\w+\s*:/m,
                /let\s+\w+\s*=/m
            ],
            'C++': [
                /^#include\s*<.*>/m,
                /^using\s+namespace\s+std/m,
                /int\s+main\s*\(/m,
                /std::/m,
                /cout\s*<</m
            ],
            'C#': [
                /^using\s+System/m,
                /^namespace\s+\w+/m,
                /Console\.WriteLine/m,
                /public\s+static\s+void\s+Main/m
            ],
            'Go': [
                /^package\s+\w+/m,
                /^import\s+\(/m,
                /^func\s+\w+\s*\(/m,
                /fmt\.Print/m
            ],
            'Rust': [
                /^fn\s+\w+\s*\(/m,
                /^use\s+std::/m,
                /println!\s*\(/m,
                /let\s+mut\s+\w+/m
            ],
            'PHP': [
                /^<\?php/m,
                /\$\w+\s*=/m,
                /echo\s+/m,
                /function\s+\w+\s*\(/m
            ],
            'Ruby': [
                /^def\s+\w+/m,
                /^class\s+\w+/m,
                /puts\s+/m,
                /require\s+['"']/m
            ],
            'JSON': [
                /^\s*{[\s\S]*}\s*$/m,
                /^\s*\[[\s\S]*\]\s*$/m
            ],
            'HTML': [
                /^<!DOCTYPE\s+html>/im,
                /<html[\s>]/im,
                /<\/html>/im,
                /<(div|span|p|h[1-6]|body|head)[\s>]/im
            ],
            'CSS': [
                /^[.#]?\w+\s*{/m,
                /^\s*\w+\s*:\s*[^;]+;/m,
                /@media\s+/m,
                /@import\s+/m
            ],
            'SQL': [
                /^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s+/im,
                /FROM\s+\w+/im,
                /WHERE\s+/im
            ],
            'XML': [
                /^<\?xml/m,
                /<\/\w+>/m,
                /<\w+[\s>]/m
            ]
        };

        for (const [language, regexes] of Object.entries(patterns)) {
            if (regexes.some(regex => regex.test(code))) {
                return language;
            }
        }

        return 'Plain Text';
    }

    async handleShare() {
        const code = this.codeInput.value.trim();
        if (!code) {
            this.showNotification('Please enter some code first!', 'error');
            return;
        }

        this.shareBtn.disabled = true;
        this.shareBtn.innerHTML = '<span class="material-icons">hourglass_empty</span>Generating...';

        try {
            const shareId = this.generateShareId();
            const language = this.detectLanguage(code);
            const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes

            // Store with cross-system compatibility
            const success = this.saveToStorage(shareId, {
                code,
                language,
                expiresAt,
                createdAt: Date.now(),
                shareId: shareId
            });

            if (!success) {
                throw new Error('Failed to save code');
            }

            // Generate enhanced shareable URL with embedded data as fallback
            const shareUrl = this.generateEnhancedShareUrl(shareId, {
                code,
                language,
                expiresAt,
                createdAt: Date.now()
            });
            
            this.shareLink.value = shareUrl;
            this.resultSection.classList.add('show');
            this.startTimer(30 * 60); // 30 minutes in seconds

            // Enhanced success message
            this.showNotification('Share link generated! Your friend can access it from any device.', 'success');
            
            // Log sharing event for debugging
            console.log('Code shared:', {
                shareId,
                language,
                codeLength: code.length,
                expiresAt: new Date(expiresAt).toISOString(),
                systemInfo: this.getSystemInfo(),
                shareUrl: shareUrl
            });

        } catch (error) {
            console.error('Share failed:', error);
            this.showNotification('Failed to generate share link. Please try again.', 'error');
        } finally {
            this.shareBtn.disabled = false;
            this.shareBtn.innerHTML = '<span class="material-icons">share</span>Share Code';
        }
    }

    generateEnhancedShareUrl(shareId, data) {
        try {
            const baseUrl = `${window.location.origin}${window.location.pathname}`;
            
            // Create a compressed version for URL embedding
            const compressedData = {
                c: data.code,
                l: data.language,
                e: data.expiresAt,
                t: data.createdAt
            };
            
            // Encode the data
            const encodedData = btoa(JSON.stringify(compressedData));
            
            // Create URL with both shareId and embedded data as fallback
            const shareUrl = `${baseUrl}?share=${shareId}&data=${encodedData}`;
            
            // Check if URL is too long (most browsers support up to 2048 characters)
            if (shareUrl.length > 2000) {
                // If too long, just use the shareId
                console.warn('Share URL too long, using basic format');
                return `${baseUrl}?share=${shareId}`;
            }
            
            return shareUrl;
        } catch (error) {
            console.warn('Failed to generate enhanced URL, using basic format:', error);
            return `${window.location.origin}${window.location.pathname}?share=${shareId}`;
        }
    }

    generateShareId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    handleClear() {
        this.codeInput.value = '';
        this.detectedLanguage.textContent = 'Auto-detecting...';
        this.resultSection.classList.remove('show');
        this.clearTimer();
        
        // Reset preview
        this.highlightedCode.textContent = '';
        if (this.isPreviewMode) {
            this.handleTogglePreview();
        }
    }

    async handleCopy() {
        try {
            await navigator.clipboard.writeText(this.shareLink.value);
            this.showNotification('Link copied! Share it across any device or system.', 'success');
            
            // Log copy event
            console.log('Share link copied:', {
                url: this.shareLink.value,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            // Fallback for older browsers or systems without clipboard API
            try {
                this.shareLink.select();
                this.shareLink.setSelectionRange(0, 99999); // For mobile devices
                document.execCommand('copy');
                this.showNotification('Link copied using fallback method!', 'success');
            } catch (fallbackError) {
                console.error('Copy failed:', fallbackError);
                this.showNotification('Copy failed. Please manually select and copy the link.', 'error');
                
                // Select the text to help user copy manually
                this.shareLink.select();
                this.shareLink.setSelectionRange(0, 99999);
            }
        }
    }

    startTimer(seconds) {
        this.clearTimer();
        let timeLeft = seconds;
        
        const updateTimer = () => {
            const minutes = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            this.timeLeft.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                this.clearTimer();
                this.showNotification('Share link has expired!', 'error');
                this.resultSection.classList.remove('show');
                
                // Clean up expired localStorage items
                this.cleanupExpiredItems();
                return;
            }
            
            timeLeft--;
        };

        updateTimer();
        this.currentTimer = setInterval(updateTimer, 1000);
    }

    clearTimer() {
        if (this.currentTimer) {
            clearInterval(this.currentTimer);
            this.currentTimer = null;
        }
    }

    loadSharedCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share');
        
        if (shareId) {
            console.log('Attempting to load shared code with ID:', shareId);
            
            // Try to get the shared data using multiple methods
            let sharedData = this.getFromStorage(shareId);
            
            // If still not found, try one more comprehensive search
            if (!sharedData) {
                sharedData = this.comprehensiveDataSearch(shareId);
            }
            
            if (sharedData) {
                console.log('Shared data found:', {
                    shareId,
                    language: sharedData.language,
                    codeLength: sharedData.code ? sharedData.code.length : 0,
                    hasExpiry: !!sharedData.expiresAt
                });
                
                // Check if expired
                if (sharedData.expiresAt && Date.now() > sharedData.expiresAt) {
                    this.showNotification('This shared code has expired!', 'error');
                    this.removeFromStorage(shareId);
                    this.cleanUrlParams();
                    return;
                }
                
                // Load the shared code
                this.codeInput.value = sharedData.code || '';
                this.detectedLanguage.textContent = sharedData.language || 'Plain Text';
                this.updateSyntaxHighlighting(sharedData.code || '', sharedData.language || 'Plain Text');
                
                // Show success message based on source
                const currentSystem = this.getSystemInfo();
                if (sharedData.sharedFrom && sharedData.sharedFrom !== currentSystem) {
                    if (sharedData.sharedFrom === 'URL_Embedded') {
                        this.showNotification('Code loaded from share link! (URL-embedded data)', 'success');
                    } else {
                        this.showNotification(`Code shared from ${this.formatSystemInfo(sharedData.sharedFrom)} loaded successfully!`, 'success');
                    }
                } else {
                    this.showNotification('Shared code loaded successfully!', 'success');
                }
                
                // Calculate remaining time
                const remainingTime = sharedData.expiresAt ? 
                    Math.floor((sharedData.expiresAt - Date.now()) / 1000) : 
                    30 * 60; // Default to 30 minutes if no expiry
                
                if (remainingTime > 0) {
                    this.startTimer(remainingTime);
                    
                    // Show the result section with the current link
                    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
                    this.shareLink.value = shareUrl;
                    this.resultSection.classList.add('show');
                }
                
                // Log successful load
                console.log('Shared code loaded successfully:', {
                    shareId,
                    language: sharedData.language,
                    originalSystem: sharedData.sharedFrom,
                    currentSystem,
                    remainingMinutes: Math.floor(remainingTime / 60)
                });
                
            } else {
                console.warn('Share ID not found in any storage method:', shareId);
                this.showNotification('Shared code not found! The link may be invalid or expired.', 'error');
                
                // Try to provide helpful debugging info
                this.debugStorageState(shareId);
            }
            
            // Clean up URL after a short delay
            setTimeout(() => {
                this.cleanUrlParams();
            }, 2000);
        }
    }

    comprehensiveDataSearch(shareId) {
        console.log('Performing comprehensive search for shareId:', shareId);
        
        // Search all possible storage locations
        const searchMethods = [
            () => window.globalCodeStorage?.get(shareId),
            () => this.getFromUrlBasedStorage(shareId),
            () => {
                const data = localStorage.getItem(this.storageKey + shareId);
                return data ? JSON.parse(data) : null;
            },
            () => {
                const data = sessionStorage.getItem(this.storageKey + shareId);
                return data ? JSON.parse(data) : null;
            },
            () => this.tryExtractFromUrl(shareId),
            () => {
                // Search all localStorage keys for any that might match
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.includes(shareId)) {
                        try {
                            const data = JSON.parse(localStorage.getItem(key) || '{}');
                            if (data.shareId === shareId || data.code) {
                                return data;
                            }
                        } catch (e) {
                            console.warn('Failed to parse potential match:', key);
                        }
                    }
                }
                return null;
            }
        ];
        
        for (let i = 0; i < searchMethods.length; i++) {
            try {
                const result = searchMethods[i]();
                if (result && result.code) {
                    console.log(`Found data using search method ${i + 1}`);
                    return result;
                }
            } catch (error) {
                console.warn(`Search method ${i + 1} failed:`, error);
            }
        }
        
        return null;
    }

    debugStorageState(shareId) {
        console.log('=== DEBUGGING STORAGE STATE ===');
        console.log('ShareId being searched:', shareId);
        console.log('GlobalStorage exists:', !!window.globalCodeStorage);
        console.log('GlobalStorage size:', window.globalCodeStorage?.size || 0);
        
        // Check localStorage
        const localStorageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.storageKey)) {
                localStorageKeys.push(key);
            }
        }
        console.log('LocalStorage keys:', localStorageKeys);
        
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        console.log('URL parameters:', Object.fromEntries(urlParams));
        
        console.log('=== END DEBUG INFO ===');
    }

    formatSystemInfo(systemInfo) {
        if (!systemInfo) return 'Unknown System';
        
        const parts = systemInfo.split('_');
        const platform = parts[0] || 'Unknown';
        const browser = parts[1] || 'Unknown';
        const deviceType = parts[2] || 'Unknown';
        
        return `${platform} (${browser} ${deviceType})`;
    }

    cleanUrlParams() {
        // Clean up URL without affecting browser history
        const url = new URL(window.location);
        url.searchParams.delete('share');
        window.history.replaceState({}, document.title, url.toString());
    }

    showNotification(message, type) {
        this.notification.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.classList.add('show');
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CodeShare();
});