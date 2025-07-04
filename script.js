class CodeShare {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadSharedCode();
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
        this.storage = new Map();
        this.isPreviewMode = false;
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

            // Store in memory (in a real app, this would be a database)
            this.storage.set(shareId, {
                code,
                language,
                expiresAt,
                createdAt: Date.now()
            });

            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
            this.shareLink.value = shareUrl;
            this.resultSection.classList.add('show');
            this.startTimer(30 * 60); // 30 minutes in seconds

            this.showNotification('Share link generated successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to generate share link. Please try again.', 'error');
        } finally {
            this.shareBtn.disabled = false;
            this.shareBtn.innerHTML = '<span class="material-icons">share</span>Share Code';
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
            this.showNotification('Link copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            this.shareLink.select();
            document.execCommand('copy');
            this.showNotification('Link copied to clipboard!', 'success');
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
            const sharedData = this.storage.get(shareId);
            
            if (sharedData) {
                if (Date.now() > sharedData.expiresAt) {
                    this.showNotification('This shared code has expired!', 'error');
                    this.storage.delete(shareId);
                    return;
                }
                
                this.codeInput.value = sharedData.code;
                this.detectedLanguage.textContent = sharedData.language;
                this.updateSyntaxHighlighting(sharedData.code, sharedData.language);
                this.showNotification('Shared code loaded successfully!', 'success');
                
                // Calculate remaining time
                const remainingTime = Math.floor((sharedData.expiresAt - Date.now()) / 1000);
                if (remainingTime > 0) {
                    this.startTimer(remainingTime);
                }
            } else {
                this.showNotification('Shared code not found or has expired!', 'error');
            }
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
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